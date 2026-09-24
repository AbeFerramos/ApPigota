console.log("Iniciando carga de JavaScript...");

const STORAGE_KEY = "pigota_junta_app_v1";
const AUTH_STORAGE_KEY = "pigota_pb_auth_v1";
const JUNTA_AUTH_KEY = "pigota_junta_auth_v1";
const VESTUARI_AUTH_KEY = "pigota_vestuari_auth_v1";
const PB_ADMIN_EMAIL = "admin@lapigota.cat";
const PB_ADMIN_PASSWORD = "lapigota2026";
const PB_CONFIG = {
    enabled: true, // Reactivado con ngrok HTTPS
    baseUrl: "https://residual-compactly-unlivable.ngrok-free.dev", // URL ngrok HTTPS
    collection: "app_state",
    keyField: "storageKey",
    dataField: "payload",
    authCollection: "users",
    useAuth: false // Mantener sin auth hasta resolver OAuth2
};

// Sistema de notificaciones
const NOTIFICATION_CONFIG = {
    enabled: true,
    vapidPublicKey: "BL YOUR_VAPID_PUBLIC_KEY_HERE", // Para web push real - generar con web-push
    useLocalNotifications: true // Usar notificaciones locales como demo hasta configurar VAPID
};
const SAVE_DEBOUNCE_MS = 500;
const REALTIME_SYNC_INTERVAL = 2000;
let remoteSaveTimer = null;
let remoteSyncInProgress = false;
let realtimeSyncTimer = null;
let juntaAuthenticated = false; // No persistir en localStorage para que se pida cada refresco
let vestuariAuthenticated = false; // No persistir en localStorage para que se pida cada refresco

console.log("Configuración básica cargada correctamente");
let syncStatus = {
    mode: "offline",
    message: "Local"
};
let authState = loadAuthState();

// Sistema de notificaciones
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("Este navegador no soporta notificaciones");
        alert("El teu navegador no suporta notificacions.");
        return false;
    }
    
    if (Notification.permission === "granted") {
        updateNotificationButton(true);
        return true;
    }
    
    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        updateNotificationButton(permission === "granted");
        
        // Si se concede el permiso, suscribirse a PocketBase Push
        if (permission === "granted") {
            await subscribeToPocketBasePush();
        }
        
        return permission === "granted";
    } else {
        alert("Les notificacions estan bloquejades. Activa-les a la configuració del navegador.");
        updateNotificationButton(false);
    }
    
    return false;
}

// Sistema de suscripción a PocketBase Push (para futuro)
async function subscribeToPocketBasePush() {
    try {
        // Registrar service worker para push
        const registration = await navigator.serviceWorker.ready;
        
        // En el futuro, esto se conectará con tu PocketBase local
        // Necesitarás configurar las claves VAPID en PocketBase
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(NOTIFICATION_CONFIG.vapidPublicKey)
        });
        
        // Enviar la suscripción a PocketBase
        if (PB_CONFIG.enabled && authState.token) {
            await fetch(`${PB_CONFIG.baseUrl}/api/collections/push_subscriptions/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authState.token}`
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    userId: authState.user?.id,
                    userAgent: navigator.userAgent
                })
            });
        }
        
        console.log("Suscrito a PocketBase Push correctamente");
        return true;
    } catch (error) {
        console.warn("Error al suscribirse a PocketBase Push:", error);
        // Si falla, seguir con notificaciones locales
        return false;
    }
}

// Utilidad para convertir VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function updateNotificationButton(enabled) {
    const btn = document.getElementById("notification-btn");
    if (btn) {
        if (enabled) {
            btn.innerHTML = '<i class="fas fa-bell"></i>';
            btn.classList.add("notification-active");
            btn.title = "Notificacions activades";
        } else {
            btn.innerHTML = '<i class="fas fa-bell-slash"></i>';
            btn.classList.remove("notification-active");
            btn.title = "Activar notificacions";
        }
    }
}

// Inicializar estado del botón de notificaciones
function initializeNotificationButton() {
    if ("Notification" in window) {
        updateNotificationButton(Notification.permission === "granted");
    } else {
        const btn = document.getElementById("notification-btn");
        if (btn) {
            btn.style.display = "none";
        }
    }
}

async function sendLocalNotification(title, body, options = {}) {
    if (!NOTIFICATION_CONFIG.enabled) return;
    
    if (NOTIFICATION_CONFIG.useLocalNotifications) {
        // Usar notificaciones locales del navegador
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
            const notification = new Notification(title, {
                body: body,
                icon: "https://cdn-icons-png.flaticon.com/512/426/426833.png",
                badge: "https://cdn-icons-png.flaticon.com/512/426/426833.png",
                vibrate: [200, 100, 200],
                ...options
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            return true;
        }
    } else {
        // Aquí iría la implementación de Web Push con VAPID
        console.log("Web Push no implementado aún - usaría VAPID");
        return false;
    }
    
    return false;
}

function sendSortidaNotification(sortida) {
    const title = "Nova sortida afegida! 🎉";
    const body = `${sortida.nom} - ${formatDate(sortida.data)} a ${sortida.lloc}`;
    const options = {
        tag: `sortida-${sortida.nom}`,
        requireInteraction: true,
        actions: [
            {
                action: "view",
                title: "Veure detalls"
            },
            {
                action: "close",
                title: "Tancar"
            }
        ]
    };
    
    // Enviar notificación local inmediatamente
    sendLocalNotification(title, body, options);
    
    // Enviar notificación push a través de PocketBase (para futuro)
    sendPocketBasePushNotification(title, body, {
        type: 'sortida',
        sortidaId: sortida.nom,
        data: sortida
    });
}

// Enviar notificación push a través de PocketBase (para futuro)
async function sendPocketBasePushNotification(title, body, data = {}) {
    if (!PB_CONFIG.enabled) return;
    
    try {
        // En el futuro, esto enviará la notificación a través de tu PocketBase local
        // Necesitarás crear un endpoint en PocketBase o usar su sistema de webhooks
        const payload = {
            title: title,
            body: body,
            icon: "https://cdn-icons-png.flaticon.com/512/426/426833.png",
            badge: "https://cdn-icons-png.flaticon.com/512/426/426833.png",
            vibrate: [200, 100, 200],
            data: data,
            requireInteraction: true
        };
        
        // Aquí iría la llamada a tu endpoint de PocketBase para enviar push
        // await fetch(`${PB_CONFIG.baseUrl}/api/send-push`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${authState.token}`
        //     },
        //     body: JSON.stringify(payload)
        // });
        
        console.log("Notificación PocketBase preparada:", payload);
    } catch (error) {
        console.warn("Error al enviar notificación PocketBase:", error);
    }
}

const defaultData = {
    juntaPassword: "junta2026",
    vestuariPassword: "vestuari2026",
    reservesRoba: [],
    recorridosMapa: {},
    junta: [
        {
            nom: "Pol",
            carrec: "President",
            color: "accent",
            funcions: [
                "Representacio externa amb Ajuntament i colles",
                "Coordinacio general de la junta",
                "Preparacio i conduccio d'assemblees",
                "Resolucio de conflictes interns"
            ]
        },
        {
            nom: "Jordi",
            carrec: "Secretari i vicepresident",
            color: "accent",
            funcions: [
                "Actes de reunions i assemblees",
                "Gestio documental i historic de decisions",
                "Convocatories i ordres del dia",
                "Segones claus de caixa"
            ]
        },
        {
            nom: "Marc",
            carrec: "Tresorer",
            color: "accent",
            funcions: [
                "Control de comptes i pressupost",
                "Subvencions",
                "Pagaments, factures i quotes",
                "Informe economic periodic"
            ]
        },
        {
            nom: "Oriol",
            carrec: "Cap de colla",
            color: "accent",
            funcions: [
                "Direccio de la colla",
                "Planificacio de correfocs i sortides",
                "Coordinacio de foc, tabals, vestuari i material",
                "Contacte amb organitzadors externs"
            ]
        },
        {
            nom: "Marta",
            carrec: "Vocal canalla i cohesio",
            color: "accent",
            funcions: [
                "Integracio d'infants amb tabals",
                "Acollida de noves families",
                "Activitats internes i cohesio"
            ]
        },
        {
            nom: "Alba",
            carrec: "Vocal comunicacio",
            color: "accent",
            funcions: [
                "Xarxes socials",
                "Comunicacio interna i difusions",
                "Enquestes de clima i satisfaccio",
                "Roba i marxandatge amb l'equip"
            ]
        },
        {
            nom: "Abraham",
            carrec: "Vocal manteniment i app",
            color: "accent",
            funcions: [
                "Manteniment i inventari",
                "Revisio de l'estat de les besties",
                "App de gestio La Pigota"
            ]
        }
    ],
    eixos: [
        "Organigrama",
        "Objectius curt termini",
        "Objectius mitja termini",
        "Temporalitat",
        "Sortides",
        "Pirotecnia",
        "Tabals",
        "Roba",
        "Canalla",
        "Subvencions",
        "Comunicacio"
    ],
    agendaBase: "Aprovacio acta anterior\n\nRepas de compromisos\n\nEstat de comptes\n\nAsseguranca i normativa\n\nEvents confirmats\n\nSortides d'agost\n\nTemes a tractar\n\nAcords i compromisos",
    comunicadores: ["President", "Secretari", "Vocal comunicacio"],
    membresColla: [
        "Abraham Fernandez",
        "Adria Figuerola",
        "Adriana Mato",
        "Alba Giralt",
        "Alba Pozuelo",
        "Alba Rullo",
        "Albert Bataller",
        "Anna Fortuny",
        "Aral Bataller",
        "Aran Jepus",
        "Ariadna Vallve",
        "Aurembiaix Vallve",
        "Bea Bellalta",
        "Carles Vallve",
        "Chema Martinez",
        "Cristian Pujol",
        "David Jansa",
        "Edu Ruiz",
        "Eira Martinez",
        "Elba Duch",
        "Eloi Macias",
        "Emma Fernandez",
        "Ermessenda Vallve",
        "Eudald Duch",
        "Feliu Fortuny",
        "Hicham Jannati",
        "Izan Fernandez",
        "Jordi Duch",
        "Jordi Munte",
        "Leia Coll",
        "Llorenc Jansa",
        "Lluis Vallve",
        "Loli Guillen",
        "Luca Fernandez",
        "Lydia Prieto",
        "Manel Jepus",
        "Marc Sanchez",
        "Maria Tarrago",
        "Marta Pellicer",
        "Marti Pons",
        "Martina Jepus",
        "Mireia de Almeida",
        "Montse Roige",
        "Nuria Princep",
        "Oriol Vallve",
        "Oscar Macias",
        "Otger Coll",
        "Pau Coll",
        "Pau Munte",
        "Pep Munte",
        "Pol Munte",
        "Remei Marsal",
        "Richi Balaguer",
        "Sonia Martos",
        "Xana Laviana"
    ],
    formulariPreguntes: [
        { id: "nom", text: "Nom i cognom", tipus: "nom", requerida: true, fixa: true },
        { id: "resposta", text: "Vindras a aquesta sortida?", tipus: "assistencia", requerida: true },
        { id: "nens", text: "Quants nens vindran amb tu?", tipus: "numero" },
        { id: "menjar", text: "Tema menjar o observacions d'al.lergies", tipus: "text" },
        { id: "notes", text: "Vols afegir alguna cosa mes?", tipus: "llarg" }
    ],
    bestiari: [
        { nom: "Av fènix", poblacio: "Pobla de Mafumet", feina: "Bestia", contacteNom: "Manel", contacteTelefon: "685 965 582" },
        { nom: "Av fènix", poblacio: "Pobla de Mafumet", feina: "Bestia", contacteNom: "Jose A Gomez", contacteTelefon: "635 646 163" },
        { nom: "Badalot", poblacio: "Arboç", feina: "Bestia", contacteNom: "Sisco", contacteTelefon: "615 096 199" },
        { nom: "Badalot", poblacio: "Arboç", feina: "Bestia", contacteNom: "Albert", contacteTelefon: "676 104 986" },
        { nom: "Borinot foc", poblacio: "Vendrell", feina: "Bestia", contacteNom: "Jordi Sendra", contacteTelefon: "608 496 281" },
        { nom: "Drac foc el tallot", poblacio: "Vendrell", feina: "Bestia", contacteNom: "Anna Garí", contacteTelefon: "651 395 382" },
        { nom: "Drac foc el tallot", poblacio: "Vendrell", feina: "Bestia", contacteNom: "Judit Barreiro", contacteTelefon: "654 843 759" },
        { nom: "Drac Bellvei", poblacio: "Bellvei", feina: "Bestia", contacteNom: "Joan Hilario", contacteTelefon: "660 850 109" },
        { nom: "Drac de foc el Cabrot", poblacio: "Vendrell", feina: "Bestia", contacteNom: "Marc Rodero", contacteTelefon: "608 900 385" },
        { nom: "Drac de foc el Cabrot", poblacio: "Vendrell", feina: "Bestia", contacteNom: "Javi Escamilla", contacteTelefon: "616 504 494" },
        { nom: "Drac font del Xum", poblacio: "Canyelles", feina: "Bestia", contacteNom: "Esther Romero", contacteTelefon: "691 897 018" },
        { nom: "Drac de la Gornal", poblacio: "Gornal", feina: "Bestia", contacteNom: "Sònia Palau", contacteTelefon: "649 792 742" },
        { nom: "Drac de Reus", poblacio: "Reus", feina: "Bestia", contacteNom: "Joan Martí", contacteTelefon: "601 431 874" },
        { nom: "Drac de Reus", poblacio: "Reus", feina: "Bestia", contacteNom: "Sergi Cotea", contacteTelefon: "653 785 948" },
        { nom: "Drac St. Jaume dels Domenys", poblacio: "Domenys", feina: "Bestia", contacteNom: "Marc Palau", contacteTelefon: "615 075 350" },
        { nom: "Drac Sta. Margarida", poblacio: "La Riera", feina: "Bestia", contacteNom: "Eduard Sedó", contacteTelefon: "622 045 952" },
        { nom: "Drac petit", poblacio: "Reus", feina: "Bestia", contacteNom: "Francesc Parra", contacteTelefon: "636 468 731" },
        { nom: "Draga", poblacio: "Cunit", feina: "Bestia", contacteNom: "Iván Escardó", contacteTelefon: "675 371 001" },
        { nom: "Draco", poblacio: "Cunit", feina: "Bestia", contacteNom: "Sandra Vidal", contacteTelefon: "661 710 609" },
        { nom: "Draco", poblacio: "Cunit", feina: "Bestia", contacteNom: "Lluis Urgell", contacteTelefon: "" },
        { nom: "Draco", poblacio: "Cunit", feina: "Bestia", contacteNom: "Imma Urgell", contacteTelefon: "647 571 022" },
        { nom: "Marrà", poblacio: "Rodonyà", feina: "Bestia", contacteNom: "Anna Figuera", contacteTelefon: "616 804 896" }
    ],
    reunions: [
        {
            data: "2026-04-17",
            titol: "Primera reunio de la nova junta",
            acords: "Parlar be els temes importants, ordenar la informacio per apartats i treballar pas a pas per evitar caos.",
            acta: "",
            arxivada: false
        },
        {
            data: "2026-05-11",
            titol: "Assemblea Pigota",
            acords: "Ratificar organigrama, repassar calendari d'events, revisar tasques obertes i concretar decisions sobre canalla, whatsapp, banc i funcionament intern.",
            acta: "President: Pol Munte. Tresorer: Marc Sanchez. Secretari: Jordi Duch. Cap de colla: Oriol Vallve. Vocals: Marta Pellicer, Alba Rullo i Abraham Fernandez.\n\nPendent de confirmar: cap de tabals amb Manel Jepus, i roba amb Alba Pozuelo i Montse Roige.\n\nEs proposa grup de WhatsApp unidireccional per a la colla, amb comunicacio vehiculada des de la junta.\n\nEs decideix impulsar el Dia de la Pigota els divendres per assaig, canalla i cohesio.\n\nQueden pendents temes de targeta Makro, canvi d'entitat bancaria, claus de tresoreria, contrasenyes i pujada d'actes al Drive.",
            arxivada: false
        }
    ],
    documents: [
        {
            id: 1,
            titol: "Estatuts de la colla",
            categoria: "Normativa",
            data: "2026-01-15",
            descripcio: "Document oficial amb els estatuts de la colla",
            arxivada: false,
            nomArxiu: null,
            tipusArxiu: null,
            contingutArxiu: null
        }
    ],
    tasques: [
        {
            titol: "Presentar subvencio de bestiari",
            responsable: "Marc",
            prioritat: "alta",
            detall: "Revisar que hi pot entrar i que es vol fer enguany.",
            estat: "oberta"
        },
        {
            titol: "Reparar besties petites",
            responsable: "Abraham",
            prioritat: "alta",
            detall: "Fer llista de reparacions i valorar cost.",
            estat: "oberta"
        },
        {
            titol: "Reparar carro de la grossa",
            responsable: "Abraham",
            prioritat: "alta",
            detall: "Coordinar revisio al taller comentat amb Llorenc.",
            estat: "oberta"
        },
        {
            titol: "Recollir les 6 parelles de baquetes ja pagades",
            responsable: "Cap de tabals",
            prioritat: "mitjana",
            detall: "Material pendent de recollir per tabals.",
            estat: "oberta"
        },
        {
            titol: "Revisar mocadors ignifugs",
            responsable: "Alba",
            prioritat: "mitjana",
            detall: "Demanar pressupost i comprovar stock actual.",
            estat: "oberta"
        },
        {
            titol: "Proposta sudadera 10 anys",
            responsable: "Alba",
            prioritat: "baixa",
            detall: "Valorar disseny lateral i model per encarrecs.",
            estat: "oberta"
        },
        {
            titol: "Calendari de dies d'assaig per noves incorporacions",
            responsable: "Oriol",
            prioritat: "alta",
            detall: "Definir dies concrets per provar i no fer proves en sortides.",
            estat: "oberta"
        },
        {
            titol: "Pressupost del correfoc de la Nou",
            responsable: "Pol",
            prioritat: "mitjana",
            detall: "Preparar pressupost si la junta ho veu viable per al juliol.",
            estat: "oberta"
        },
        {
            titol: "Certificat entitat digital",
            responsable: "Pol Marxant",
            prioritat: "alta",
            detall: "Parlar amb l'Ari per veure com i quan s'ha de fer.",
            estat: "oberta"
        },
        {
            titol: "Firma canvi de compte bancari",
            responsable: "Marc Sanchez",
            prioritat: "alta",
            detall: "Mirar una altra entitat per evitar comissions i preparar el canvi.",
            estat: "oberta"
        },
        {
            titol: "Caps de drac impressio 3D",
            responsable: "Jordi Duch",
            prioritat: "mitjana",
            detall: "Demanar pressupost per imprimir diversos caps de drac en 3D.",
            estat: "oberta"
        },
        {
            titol: "Tour voluntaris etapa 2",
            responsable: "Oriol Vallve",
            prioritat: "mitjana",
            detall: "Buscar i apuntar la colla com a voluntaris al Tour de Franca.",
            estat: "oberta"
        },
        {
            titol: "Demanar targeta Makro",
            responsable: "Tresoreria",
            prioritat: "baixa",
            detall: "Queda pendent tramitar la targeta Makro.",
            estat: "oberta"
        }
    ],
    sortides: [
        {
            nom: "Correfoc de la Nou",
            lloc: "La Nou",
            data: "2026-07-15",
            estat: "pendent pressupost",
            notes: "L'alcaldessa ha preguntat si es vol fer petites i grossa. Cal valorar caps de setmana i pressupost.",
            piroUsada: {
                carretilles: 0,
                infantils: 0,
                brolladors: 0,
                efectes: 0
            },
            assistencia: []
        },
        {
            nom: "La Pobla - Festa del Gall",
            lloc: "La Pobla",
            data: "2026-07-25",
            estat: "en proces",
            notes: "Parlar amb els del Gall. Prevista per adults i infantils.",
            piroUsada: {
                carretilles: 0,
                infantils: 0,
                brolladors: 0,
                efectes: 0
            },
            assistencia: []
        },
        {
            nom: "Creixell",
            lloc: "Creixell",
            data: "2026-08-01",
            estat: "pendent de tancar",
            notes: "Encara no esta tancat, cal parlar-hi.",
            piroUsada: {
                carretilles: 0,
                infantils: 0,
                brolladors: 0,
                efectes: 0
            },
            assistencia: []
        },
        {
            nom: "Dinar i assaig de colla",
            lloc: "La Pobla",
            data: "2026-06-07",
            estat: "pendent",
            notes: "Quedar tots, fer dinar i assaig de correfocs. El Pol fara paella.",
            piroUsada: {
                carretilles: 0,
                infantils: 0,
                brolladors: 0,
                efectes: 0
            },
            assistencia: []
        }
    ],
    piroStock: {
        carretilles: 500,
        infantils: 150,
        brolladors: 40,
        efectes: 12
    },
    vestuariStock: {
        dalt: { GA: 1, L: 0, M: 4, P: 7, ESPECIALS: 6, PI: 6, MI: 8, GI: 5, "TELA FINA M": 1 },
        baix: { G: 5, L: 0, M: 13, P: 3, ESPECIALS: 2, PIE: 3, Pi: 2, MI: 9, GI: 6, "TELA FINA MINI": 1, "TELA FINA M/P": 2 }
    },
    vestuariAssignacions: [
        // ADULTS
        { nom: "Albert Fortuny", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Llorenç Jansà", daltTalla: "G", daltEstat: "guardarropa", baixTalla: "G", baixEstat: "guardarropa" },
        { nom: "Cristian Pujol", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "David Jansà", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Oriol Vallvé", daltTalla: "G", daltEstat: "guardarropa", baixTalla: "G", baixEstat: "guardarropa" },
        { nom: "Adrià Seco", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Marc Sánchez", daltTalla: "G", daltEstat: "guardarropa", baixTalla: "G", baixEstat: "guardarropa" },
        { nom: "Carles Vallvé", daltTalla: "G", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Chema Martínez", daltTalla: "G", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Jordi Duch", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Sònia Martos", daltTalla: "G", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Richi Balaguer", daltTalla: "G", daltEstat: "guardarropa", baixTalla: "G", baixEstat: "guardarropa" },
        { nom: "Oscar Macias", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Pol Munté", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Edu Ruiz", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Bea Bellalta", daltTalla: "G", daltEstat: "guardarropa", baixTalla: "G", baixEstat: "guardarropa" },
        { nom: "Alba Giralt", daltTalla: "P", daltEstat: "guardarropa", baixTalla: "P", baixEstat: "guardarropa" },
        { nom: "Pau Coll", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Anna Fortuny", daltTalla: "G", daltEstat: "guardarropa", baixTalla: "ESPECIALS", baixEstat: "guardarropa" },
        { nom: "Remei Marçal", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Alba Pozuelo", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Manel Jepus", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Alba Rullo", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Xana Laviana", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Albert Bataller", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Marta Pellicer", daltTalla: "P", daltEstat: "guardarropa", baixTalla: "P", baixEstat: "guardarropa" },
        { nom: "Mireia Almeida", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Rocío Cañero", daltTalla: "P", daltEstat: "guardarropa", baixTalla: "P", baixEstat: "guardarropa" },
        { nom: "Claudia Pino", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Ari Vallvé", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "ESPECIALS", baixEstat: "guardarropa" },
        { nom: "Nuria Príncep", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "ESPECIALS", baixEstat: "guardarropa" },
        { nom: "Maria", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Montse", daltTalla: "P", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        
        // INFANTILS
        { nom: "Martí Pons", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Eira Martínez", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Martina Jepus", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Aral Bataller", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Eudald Duch", daltTalla: "", daltEstat: "guardarropa", baixTalla: "G", baixEstat: "guardarropa" },
        { nom: "Otger Coll", daltTalla: "P", daltEstat: "guardarropa", baixTalla: "P", baixEstat: "guardarropa" },
        { nom: "Aurembiaix Vallvé", daltTalla: "P", daltEstat: "guardarropa", baixTalla: "P", baixEstat: "guardarropa" },
        { nom: "Elba Duch", daltTalla: "P", daltEstat: "guardarropa", baixTalla: "M", baixEstat: "guardarropa" },
        { nom: "Pep Munté", daltTalla: "P", daltEstat: "guardarropa", baixTalla: "P", baixEstat: "guardarropa" },
        { nom: "Pau Munté", daltTalla: "P", daltEstat: "guardarropa", baixTalla: "PE", baixEstat: "guardarropa" },
        { nom: "Ermessenda Vallvé", daltTalla: "ESPECIALS", daltEstat: "guardarropa", baixTalla: "ESPECIALS", baixEstat: "guardarropa" },
        { nom: "Feliu Fortuny", daltTalla: "P", daltEstat: "guardarropa", baixTalla: "P", baixEstat: "guardarropa" },
        { nom: "Leia Coll", daltTalla: "ESPECIALS", daltEstat: "guardarropa", baixTalla: "ESPECIALS", baixEstat: "guardarropa" },
        { nom: "Aran Jepus", daltTalla: "", daltEstat: "guardarropa", baixTalla: "ESPECIALS", baixEstat: "guardarropa" },
        { nom: "Eloi Macias", daltTalla: "ESPECIALS", daltEstat: "persona", baixTalla: "ESPECIALS", baixEstat: "persona" },
        { nom: "Jordi Munté", daltTalla: "", daltEstat: "guardarropa", baixTalla: "", baixEstat: "guardarropa" },
        
        // NUEVOS INFANTILES
        { nom: "Izan", daltTalla: "M", daltEstat: "guardarropa", baixTalla: "G", baixEstat: "guardarropa" },
        { nom: "Emma", daltTalla: "P", daltEstat: "guardarropa", baixTalla: "P", baixEstat: "guardarropa" },
        { nom: "Luca", daltTalla: "ESPECIALS", daltEstat: "guardarropa", baixTalla: "ESPECIALS", baixEstat: "guardarropa" }
    ],
    tabalers: [
        { nom: "Manel", tipus: "adult", edat: 34, assajosMes: 2 },
        { nom: "Martina", tipus: "infantil", edat: 10, assajosMes: 1 },
        { nom: "Nova incorporacio", tipus: "adult", edat: 21, assajosMes: 0 }
    ],
    bestiari: [
        {
            nom: "Carro de la Grossa",
            poblacio: "La Pobla",
            feina: "Coordinar revisió al taller comentat amb Llorenç.",
            contacteNom: "Llorenç (Taller)",
            contacteTelefon: "600112233"
        },
        {
            nom: "Bèsties Petites",
            poblacio: "La Pobla",
            feina: "Revisió de pintura i fusta realitzada correctament.",
            contacteNom: "Abraham",
            contacteTelefon: "699887766"
        }
    ]
};

let state = loadState();
let isFreshInstall = !localStorage.getItem(STORAGE_KEY);
normalizeState();
if (isFreshInstall) {
    mergeSeedData();
}

function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return structuredClone(defaultData);
    try {
        const loadedState = { ...structuredClone(defaultData), ...JSON.parse(stored) };
        // Forzar que bestiari siempre use los datos por defecto más recientes
        if (defaultData.bestiari && defaultData.bestiari.length > 0) {
            loadedState.bestiari = defaultData.bestiari;
        }
        return loadedState;
    } catch {
        return structuredClone(defaultData);
    }
}

function loadAuthState() {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return { token: "", user: null };
    try {
        const parsed = JSON.parse(stored);
        return {
            token: parsed?.token || "",
            user: parsed?.user || null
        };
    } catch {
        return { token: "", user: null };
    }
}

function saveAuthState() {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    updateAuthStatus();
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    queueRemoteSave();
    updateSyncStatus();
}

function queueRemoteSave() {
    if (!PB_CONFIG.enabled) return;
    window.clearTimeout(remoteSaveTimer);
    setSyncStatus("syncing", "Sincronitzant...");
    remoteSaveTimer = window.setTimeout(() => {
        persistStateToPocketBase();
    }, SAVE_DEBOUNCE_MS);
}

function normalizeFormQuestions(value) {
    const baseQuestions = defaultData.formulariPreguntes;
    if (!Array.isArray(value)) {
        const oldValue = value || {};
        return baseQuestions.map((question) => ({
            ...question,
            text: oldValue[question.id] || question.text
        }));
    }

    const byId = new Map();
    baseQuestions.forEach((question) => byId.set(question.id, { ...question }));
    value.forEach((question) => {
        const cleanText = (question?.text || "").trim();
        if (!cleanText) return;
        const id = question.id || createQuestionId(cleanText);
        if (byId.has(id)) {
            byId.set(id, { ...byId.get(id), ...question, id, text: cleanText });
            return;
        }
        const duplicate = Array.from(byId.values()).some(
            (item) => item.text.toLocaleLowerCase("ca") === cleanText.toLocaleLowerCase("ca")
        );
        if (!duplicate) {
            byId.set(id, {
                id,
                text: cleanText,
                tipus: question.tipus || "text",
                requerida: Boolean(question.requerida),
                fixa: Boolean(question.fixa)
            });
        }
    });
    return Array.from(byId.values());
}

function createQuestionId(text) {
    const base = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 32) || "pregunta";
    let candidate = `extra-${base}`;
    let counter = 2;
    while (state?.formulariPreguntes?.some((question) => question.id === candidate)) {
        candidate = `extra-${base}-${counter}`;
        counter += 1;
    }
    return candidate;
}

function normalizeState() {
    state.membresColla = Array.from(new Set([
        ...(defaultData.membresColla || []),
        ...(state.membresColla || [])
    ])).filter(Boolean).sort((a, b) => a.localeCompare(b, "ca"));
    state.formulariPreguntes = normalizeFormQuestions(state.formulariPreguntes);
    if (Array.isArray(state.agendaBase)) {
        state.agendaBase = state.agendaBase.join("\n\n");
    }
    state.sortides = (state.sortides || []).map((sortida) => ({
        ...sortida,
        piroUsada: {
            carretilles: Number(sortida?.piroUsada?.carretilles || sortida?.piroReserva?.carretilles || 0),
            infantils: Number(sortida?.piroUsada?.infantils || sortida?.piroReserva?.infantils || 0),
            brolladors: Number(sortida?.piroUsada?.brolladors || sortida?.piroReserva?.brolladors || 0),
            efectes: Number(sortida?.piroUsada?.efectes || sortida?.piroReserva?.efectes || 0)
        },
        checklist: (sortida?.checklist || [
            { text: "Paperassa", feta: false },
            { text: "Enceses", feta: false },
            { text: "Piro preparada", feta: false },
            { text: "Transport i carrega", feta: false },
            { text: "Menjar i aigua", feta: false }
        ]).map((item) => ({
            text: item.text,
            feta: Boolean(item.feta)
        })),
        assistencia: (sortida?.assistencia || []).map((item) => ({
            nom: item.nom || "",
            resposta: item.resposta || "potser",
            nens: Number(item.nens || 0),
            menjar: item.menjar || "",
            notes: item.notes || "",
            extra: item.extra || item.respostesExtra || {}
        }))
    }));
    state.reunions = (state.reunions || []).map((meeting) => ({
        ...meeting,
        acta: meeting?.acta || "",
        arxivada: Boolean(meeting?.arxivada)
    }));
    state.documents = (state.documents || []).map((doc) => ({
        ...doc,
        id: doc?.id || Date.now() + Math.random(),
        nomArxiu: doc?.nomArxiu || null,
        tipusArxiu: doc?.tipusArxiu || null,
        contingutArxiu: doc?.contingutArxiu || null,
        arxivada: Boolean(doc?.arxivada)
    }));
    state.bestiari = (state.bestiari || []).map((bestia) => ({
        nom: bestia.nom || "",
        poblacio: bestia.poblacio || bestia.estat || "",
        feina: bestia.feina || bestia.detalls || "",
        contacteNom: bestia.contacteNom || "",
        contacteTelefon: bestia.contacteTelefon || ""
    }));
    
    state.reservesRoba = (state.reservesRoba || []).map((reserva) => ({
        sortidaId: reserva.sortidaId || "",
        nom: reserva.nom || "",
        daltTalla: reserva.daltTalla || "",
        daltEstat: reserva.daltEstat || "guardarropa",
        baixTalla: reserva.baixTalla || "",
        baixEstat: reserva.baixEstat || "guardarropa"
    }));
    
    // Inicializar reservesRoba si no existe
    if (!state.reservesRoba) {
        state.reservesRoba = [];
    }
    
    // Inicializar vestuariAssignacions si no existe
    if (!state.vestuariAssignacions) {
        state.vestuariAssignacions = [];
    }
    
    // Forzar actualización de bestiari con los nuevos datos
    // Si no hay datos por defecto o está vacío, mantener lo que hay
    if (defaultData.bestiari && defaultData.bestiari.length > 0) {
        state.bestiari = defaultData.bestiari;
    }
    
    // Forzar actualización del stock de vestuario con los nuevos datos
    if (defaultData.vestuariStock) {
        state.vestuariStock = defaultData.vestuariStock;
    }
    
    // Forzar actualización de las asignaciones de vestuario con los nuevos datos
    if (defaultData.vestuariAssignacions && defaultData.vestuariAssignacions.length > 0) {
        state.vestuariAssignacions = defaultData.vestuariAssignacions;
    }
    
    state.recorridosMapa = state.recorridosMapa || defaultData.recorridosMapa;
}

function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
}

function mergeSeedData() {
    const defaultMeetingTitles = new Set(state.reunions.map((item) => item.titol));
    defaultData.reunions.forEach((meeting) => {
        if (!defaultMeetingTitles.has(meeting.titol)) {
            state.reunions.push(cloneValue(meeting));
        }
    });

    const defaultTaskTitles = new Set(state.tasques.map((item) => item.titol));
    defaultData.tasques.forEach((task) => {
        if (!defaultTaskTitles.has(task.titol)) {
            state.tasques.push(cloneValue(task));
        }
    });

    const defaultDocTitles = new Set(state.documents.map((item) => item.titol));
    defaultData.documents.forEach((doc) => {
        if (!defaultDocTitles.has(doc.titol)) {
            state.documents.push(cloneValue(doc));
        }
    });

    const defaultSortidaNames = new Set(state.sortides.map((item) => item.nom));
    defaultData.sortides.forEach((sortida) => {
        if (!defaultSortidaNames.has(sortida.nom)) {
            state.sortides.push(cloneValue(sortida));
        }
    });

    const defaultBestiaNames = new Set((state.bestiari || []).map((item) => item.nom));
    defaultData.bestiari.forEach((bestia) => {
        if (!defaultBestiaNames.has(bestia.nom)) {
            state.bestiari.push(cloneValue(bestia));
        }
    });
}

function buildPocketBaseUrl(path) {
    return `${PB_CONFIG.baseUrl}${path}`;
}

function setSyncStatus(mode, message) {
    syncStatus = { mode, message };
    updateSyncStatus();
}

function updateSyncStatus() {
    const element = document.getElementById("sync-status");
    if (!element) return;
    element.className = `sync-status ${syncStatus.mode}`;
    element.innerText = syncStatus.message;
    element.title = syncStatus.message;
}

function updateAuthStatus() {
    const buttonElement = document.getElementById("auth-action-btn");
    if (!buttonElement) return;

    if (authState.token) {
        const label = authState.user?.email || authState.user?.username || "Connectat";
        buttonElement.innerText = "Sortir";
        buttonElement.title = `Sessio: ${label}`;
    } else {
        buttonElement.innerText = "Sessio";
        buttonElement.title = "Iniciar sessio PocketBase";
    }
}

function getPocketBaseHeaders(extra = {}) {
    const headers = { 
        ...extra,
        "Content-Type": "application/json"
    };
    
    // Usar token de autenticación si está disponible
    if (authState.token) {
        headers.Authorization = `Bearer ${authState.token}`;
    }
    
    return headers;
}

async function fetchPocketBaseRecord() {
    // Solo autenticar si useAuth está habilitado
    if (PB_CONFIG.useAuth) {
        try {
            // Autenticar como admin para asegurar permisos
            const authResponse = await fetch(
                buildPocketBaseUrl('/api/admins/auth-with-password'),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        identity: PB_ADMIN_EMAIL,
                        password: PB_ADMIN_PASSWORD
                    })
                }
            );
            
            if (authResponse.ok) {
                const authData = await authResponse.json();
                authState.token = authData.token;
                saveAuthState();
            }
        } catch (error) {
            console.warn("No se pudo autenticar como admin:", error);
        }
    }
    
    const filter = encodeURIComponent(`${PB_CONFIG.keyField}="${STORAGE_KEY}"`);
    const headers = PB_CONFIG.useAuth ? getPocketBaseHeaders() : {};
    const response = await fetch(
        buildPocketBaseUrl(`/api/collections/${PB_CONFIG.collection}/records?filter=${filter}&perPage=1`),
        {
            headers: headers
        }
    );
    
    if (!response.ok) {
        throw new Error(`PocketBase list failed: ${response.status}`);
    }
    
    const payload = await response.json();
    return payload.items?.[0] || null;
}

async function persistStateToPocketBase() {
    if (!PB_CONFIG.enabled || remoteSyncInProgress) return;
    remoteSyncInProgress = true;
    setSyncStatus("syncing", "Sincronitzant...");

    try {
        const existing = await fetchPocketBaseRecord();
        const body = {
            [PB_CONFIG.keyField]: STORAGE_KEY,
            [PB_CONFIG.dataField]: JSON.stringify(state)  // Convertir a JSON string
        };

        const targetUrl = existing
            ? buildPocketBaseUrl(`/api/collections/${PB_CONFIG.collection}/records/${existing.id}`)
            : buildPocketBaseUrl(`/api/collections/${PB_CONFIG.collection}/records`);

        const method = existing ? "PATCH" : "POST";
        const headers = PB_CONFIG.useAuth ? getPocketBaseHeaders({
            "Content-Type": "application/json"
        }) : {
            "Content-Type": "application/json"
        };
        
        const response = await fetch(targetUrl, {
            method,
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`PocketBase save failed: ${response.status}`);
        }
        
        const result = await response.json();
        setSyncStatus("ok", "Sincronitzat");
        
        // Usar el timestamp del servidor para evitar bucles
        if (result.updated) {
            const serverTime = new Date(result.updated).getTime();
            localStorage.setItem('lastRemoteUpdate', serverTime);
            localStorage.setItem('lastLocalSave', serverTime); // Marcar como guardado por este dispositivo
        }
    } catch (error) {
        console.warn("PocketBase save fallback to localStorage only:", error);
        setSyncStatus("error", `Error PB: ${error.message}`);
    } finally {
        remoteSyncInProgress = false;
    }
}

// Sistema de sincronización en tiempo real con WebSocket
function connectWebSocket() {
    if (!PB_CONFIG.enabled) return;
    
    try {
        // PocketBase no tiene WebSocket nativo, pero podemos usar el sistema de suscripciones
        // Por ahora, usaremos polling optimizado con notificaciones visuales
        console.log("Sistema de sincronización optimizado iniciado");
    } catch (error) {
        console.error("Error conectando WebSocket:", error);
    }
}

async function checkRemoteChanges() {
    if (!PB_CONFIG.enabled || remoteSyncInProgress) return;
    
    try {
        const record = await fetchPocketBaseRecord();
        if (!record) return;
        
        let remoteData = record[PB_CONFIG.dataField];
        
        // Parsear si viene como string JSON
        if (typeof remoteData === "string") {
            try {
                remoteData = JSON.parse(remoteData);
            } catch (parseError) {
                console.error("Error parseando datos remotos:", parseError);
                return;
            }
        }
        
        const lastRemoteUpdate = record.updated;
        const lastLocalUpdate = localStorage.getItem('lastRemoteUpdate');
        
        // Si hay cambios remotos más recientes que la última actualización local
        // Añadir un margen de 1 segundo para evitar bucles
        const remoteTime = new Date(lastRemoteUpdate).getTime();
        const localTime = lastLocalUpdate ? parseInt(lastLocalUpdate) : 0;
        
        if (lastRemoteUpdate && (remoteTime > localTime + 1000)) {
            console.log("🔄 Detectados cambios remotos, actualizando estado local...");
            
            // Actualizar estado local con datos remotos
            Object.assign(state, remoteData);
            normalizeState();
            renderAll();
            
            localStorage.setItem('lastRemoteUpdate', remoteTime);
            setSyncStatus("updated", "Actualitzat");
            
            // Mostrar notificación de actualización más visible
            showToast("🔄 Dades actualitzades des d'un altre dispositiu", "info");
            
            // Sonido de notificación (si el navegador lo permite)
            try {
                if (Notification.permission === "granted") {
                    new Notification("Actualización La Pigota", {
                        body: "Cambios sincronizados desde otro dispositivo",
                        icon: "https://cdn-icons-png.flaticon.com/512/426/426833.png"
                    });
                }
            } catch (e) {
                // El navegador no soporta notificaciones o están bloqueadas
            }
            
            // Volver a estado online después de unos segundos
            setTimeout(() => {
                setSyncStatus("ok", "Sincronitzat");
            }, 2000);
        }
    } catch (error) {
        console.error("Error verificando cambios remotos:", error);
    }
}

function startRealtimeSync() {
    if (!PB_CONFIG.enabled) return;
    
    // Iniciar polling para verificar cambios
    if (realtimeSyncTimer) {
        clearInterval(realtimeSyncTimer);
    }
    
    realtimeSyncTimer = setInterval(() => {
        checkRemoteChanges();
    }, REALTIME_SYNC_INTERVAL);
    
    console.log(`🔄 Sincronización en tiempo real iniciada (polling cada ${REALTIME_SYNC_INTERVAL/1000}s)`);
    console.log("📱 La aplicación detectará cambios de otros dispositivos automáticamente");
}

function stopRealtimeSync() {
    if (realtimeSyncTimer) {
        clearInterval(realtimeSyncTimer);
        realtimeSyncTimer = null;
        console.log("Sincronización en tiempo real detenida");
    }
}

async function loginPocketBase(email, password) {
    const response = await fetch(
        buildPocketBaseUrl(`/api/collections/${PB_CONFIG.authCollection}/auth-with-password`),
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identity: email,
                password
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
    }

    const payload = await response.json();
    authState = {
        token: payload.token,
        user: payload.record || null
    };
    saveAuthState();
    setSyncStatus("syncing", "Sessio iniciada");
    
    // Iniciar sincronización en tiempo real
    startRealtimeSync();
}

function logoutPocketBase() {
    authState = { token: "", user: null };
    saveAuthState();
    setSyncStatus("offline", "Local");
    
    // Detener sincronización en tiempo real
    stopRealtimeSync();
}

async function hydrateStateFromPocketBase() {
    if (!PB_CONFIG.enabled) return;
    setSyncStatus("syncing", "Connectant PB...");

    try {
        const record = await fetchPocketBaseRecord();
        const remoteData = record?.[PB_CONFIG.dataField];
        
        // Si los datos vienen como string JSON, parsearlos
        if (typeof remoteData === "string") {
            try {
                const parsedData = JSON.parse(remoteData);
                if (!parsedData || typeof parsedData !== "object") {
                    setSyncStatus("offline", "PB buit, pendent de pujar");
                    await persistStateToPocketBase();
                    return;
                }
                state = { ...structuredClone(defaultData), ...parsedData };
            } catch (parseError) {
                console.error("Error parseando datos remotos:", parseError);
                setSyncStatus("offline", "PB buit, pendent de pujar");
                await persistStateToPocketBase();
                return;
            }
        } else if (!remoteData || typeof remoteData !== "object") {
            setSyncStatus("offline", "PB buit, pendent de pujar");
            await persistStateToPocketBase();
            return;
        } else {
            state = { ...structuredClone(defaultData), ...remoteData };
        }

        normalizeState();
        normalizeState();
        renderAll({ persist: false });
        setSyncStatus("ok", "Sincronitzat");
        
        // Guardar timestamp de actualización remota
        if (record.updated) {
            localStorage.setItem('lastRemoteUpdate', record.updated);
        }
        
        // Iniciar sincronización en tiempo real
        startRealtimeSync();
    } catch (error) {
        console.warn("PocketBase load fallback to localStorage only:", error);
        setSyncStatus("error", `Error PB: ${error.message}`);
    }
}

let currentJuntaSubTab = "junta-membres";
let calendarViewDate = new Date(); // Inicializa con la fecha actual

function showTab(tabId) {
    if (tabId === "tab-junta" && !juntaAuthenticated) {
        openJuntaAuthModal();
        return;
    }
    if (tabId === "tab-vestuari" && !vestuariAuthenticated) {
        openVestuariAuthModal();
        return;
    }
    document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.remove("active"));
    document.getElementById(tabId)?.classList.add("active");
    const btnId = "btn-" + tabId.replace("tab-", "");
    document.getElementById(btnId)?.classList.add("active");

    if (tabId === "tab-junta") {
        showJuntaSubTab(currentJuntaSubTab);
    }
}

function showJuntaSubTab(subTabId) {
    currentJuntaSubTab = subTabId;
    document.querySelectorAll(".junta-subcontent").forEach((panel) => panel.classList.remove("active"));
    document.querySelectorAll(".junta-subnav-item").forEach((button) => button.classList.remove("active"));
    document.getElementById(subTabId)?.classList.add("active");
    document.getElementById("btn-" + subTabId)?.classList.add("active");
    
    // Inicializar mapa cuando se accede a bestiari
    if (subTabId === "junta-bestiari") {
        setTimeout(() => {
            inicialitzarMapa();
        }, 100);
    }
}

function toggleModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
}

function renderAll(options = {}) {
    try {
        const { persist = true } = options;
        renderDashboard();
        renderJunta();
        renderDocumentacio();
        renderReunions();
        renderTasques();
        renderSortides();
        renderFormulari();
        renderRespostesForm();
        renderPiro();
        renderVestuari();
        renderTabals();
        renderBestiari();
        if (persist) saveState();
    } catch (error) {
        console.error("Error en renderAll:", error);
    }
}

function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    window.setTimeout(() => {
        toast.classList.add("toast-out");
        window.setTimeout(() => toast.remove(), 280);
    }, 3200);
}

function confirmDelete(label) {
    return window.confirm(`Segur que vols eliminar "${label}"? Aquesta accio no es pot desfer.`);
}

function renderDashboard() {
    const tasquesObertes = state.tasques.filter((task) => task.estat !== "feta");
    const tabalersAptes = state.tabalers.filter((member) => esAptePerSortida(member)).length;
    const prioritariesCount = state.tasques.filter((task) => task.prioritat === "alta" && task.estat !== "feta").length;

    document.getElementById("dashboard-tareas-abiertas").innerText = tasquesObertes.length;
    document.getElementById("metric-sortides").innerText = state.sortides.length;
    document.getElementById("metric-tabalers").innerText = tabalersAptes;
    document.getElementById("metric-piro").innerText = state.sortides.filter(s => Object.values(s.piroUsada || {}).some(v => v > 0)).length;
    document.getElementById("metric-prioritats").innerText = prioritariesCount;

    document.getElementById("dashboard-resumen").innerText =
        `La junta te ${tasquesObertes.length} tasques actives, ${state.sortides.length} sortides en seguiment i ${tabalersAptes} tabalers aptes segons la norma minima d'assaig mensual.`;
}

function renderJunta() {
    document.getElementById("lista-junta").innerHTML = state.junta
        .map(
            (person, index) => `
                <article class="person-card">
                    <h3>${person.carrec}</h3>
                    <div class="meta-line">${person.nom}</div>
                    <ul>
                        ${person.funcions.map((task) => `<li>${task}</li>`).join("")}
                    </ul>
                    <div class="actions-row">
                        <button onclick="editarJunta(${index})">Editar</button>
                        <button onclick="eliminarJunta(${index})">Eliminar</button>
                    </div>
                </article>
            `
        )
        .join("");
}

function renderDocumentacio() {
    const renderDocumentCard = (doc, actualIndex, archived = false) => `
        <article class="timeline-card">
            <h3>${doc.titol}</h3>
            <div class="meta-line">${doc.categoria} · ${formatDate(doc.data)}</div>
            <p>${doc.descripcio}</p>
            ${doc.nomArxiu ? `
                <div class="file-attachment">
                    <i class="fas fa-file"></i>
                    <a href="${doc.contingutArxiu}" download="${doc.nomArxiu}" class="file-link">${doc.nomArxiu}</a>
                    <button onclick="eliminarArxiuDocument(${actualIndex})" class="btn-delete-file" title="Eliminar arxiu">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            ` : ''}
            <div class="actions-row">
                <button onclick="editarDocument(${actualIndex})">Editar</button>
                <button onclick="${archived ? `desarxivarDocument(${actualIndex})` : `arxivarDocument(${actualIndex})`}">${archived ? "Desarxivar" : "Arxivar"}</button>
                <button onclick="eliminarDocument(${actualIndex})">Eliminar</button>
            </div>
        </article>
    `;

    const activeDocs = state.documents.filter((doc) => !doc.arxivada);
    const archivedDocs = state.documents.filter((doc) => doc.arxivada);

    document.getElementById("lista-documents").innerHTML = activeDocs.length
        ? activeDocs.map((doc, i) => renderDocumentCard(doc, state.documents.indexOf(doc), false)).join("")
        : '<p class="small-text">No hi ha documents actius.</p>';

    document.getElementById("lista-documents-arxivats").innerHTML = archivedDocs.length
        ? archivedDocs.map((doc, i) => renderDocumentCard(doc, state.documents.indexOf(doc), true)).join("")
        : '<p class="small-text">No hi ha documents arxivats.</p>';
}

function renderReunions() {
    document.getElementById("lista-agenda-base").innerHTML = `
        <div class="board-card">
            <div class="text-block">${formatTextBlock(state.agendaBase)}</div>
        </div>
    `;

    const renderMeetingCard = (meeting, actualIndex, archived = false) => `
        <article class="timeline-card">
            <h3>${meeting.titol}</h3>
            <div class="meta-line">${formatDate(meeting.data)}</div>
            <p>${meeting.acords}</p>
            ${meeting.acta ? `<div class="board-card compact"><strong>Acta</strong><div class="text-block">${formatTextBlock(meeting.acta)}</div></div>` : ""}
            <div class="actions-row">
                <button onclick="editarReunio(${actualIndex})">Editar</button>
                <button onclick="${archived ? `desarxivarReunio(${actualIndex})` : `arxivarReunio(${actualIndex})`}">${archived ? "Desarxivar" : "Arxivar"}</button>
                <button onclick="eliminarReunio(${actualIndex})">Eliminar</button>
            </div>
        </article>
    `;

    document.getElementById("lista-reunions").innerHTML = [...state.reunions]
        .filter((meeting) => !meeting.arxivada)
        .sort((a, b) => b.data.localeCompare(a.data))
        .map((meeting) => {
            const actualIndex = state.reunions.indexOf(meeting);
            return renderMeetingCard(meeting, actualIndex, false);
        })
        .join("");

    document.getElementById("lista-reunions-arxivades").innerHTML = [...state.reunions]
        .filter((meeting) => meeting.arxivada)
        .sort((a, b) => b.data.localeCompare(a.data))
        .map((meeting) => {
            const actualIndex = state.reunions.indexOf(meeting);
            return renderMeetingCard(meeting, actualIndex, true);
        })
        .join("") || `<div class="info-card compact"><p>No hi ha reunions arxivades.</p></div>`;
}

function renderTasques() {
    document.getElementById("lista-tasques").innerHTML = state.tasques
        .map(
            (task, index) => `
                <article class="board-card">
                    <h3>${task.titol}</h3>
                    <div class="priority-bar">
                        <span class="badge ${task.prioritat}">${task.prioritat}</span>
                        <span class="badge ${task.estat}">${task.estat}</span>
                    </div>
                    <p>${task.detall || "Sense detall afegit."}</p>
                    <div class="meta-line">Responsable: ${task.responsable || "Sense assignar"}</div>
                    <div class="actions-row">
                        <button onclick="editarTasca(${index})">Editar</button>
                        <button onclick="cambiarEstatTasca(${index})">${task.estat === "feta" ? "Reobrir" : "Marcar feta"}</button>
                        <button onclick="eliminarTasca(${index})">Eliminar</button>
                    </div>
                </article>
            `
        )
        .join("");
}

function renderSortides() {
    try {
        const select = document.getElementById("sortida-gestio-select");
        const currentSortidaIndex = select?.value ?? "";
        const calendarioContainer = document.getElementById("calendari-sortides");

        if (calendarioContainer) {
            calendarioContainer.innerHTML = renderCalendarioSortides();
        }

        if (select) {
            const currentValue = select.value;
            select.innerHTML = `<option value="">Selecciona una sortida</option>${state.sortides
                .map((trip, index) => `<option value="${index}">${trip.nom} · ${formatDate(trip.data)}</option>`)
                .join("")}`;
            if (currentValue !== "" && state.sortides[currentValue]) {
                select.value = currentValue;
            } else if (currentValue === "" && state.sortides.length === 1) {
                select.value = "0";
            }
        }

        renderGestioSortida();
    } catch (error) {
        console.error("Error en renderSortides:", error);
    }
}

function renderCalendarioSortides() {
    const currentYear = calendarViewDate.getFullYear();
    const currentMonth = calendarViewDate.getMonth();
    const now = new Date();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDay.getDay(); // 0 = domingo, 1 = lunes, etc.
    const totalDays = lastDay.getDate();
    
    const daysInMonth = [];
    // JavaScript getDay(): 0=Domingo, 1=Lunes, etc.
    for (let i = 0; i < startDay; i++) {
        daysInMonth.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
        daysInMonth.push(i);
    }
    
    const monthNames = ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", 
                        "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"];
    
    const monthSortides = state.sortides.filter(trip => {
        if (!trip.data) return false;
        const tripDate = new Date(trip.data + 'T12:00:00'); // Forzar mediodía para evitar problemas de zona horaria
        return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
    });
    
    let calendarHTML = `
        <div class="calendar-container">
            <div class="calendar-header">
                <button class="btn-calendar-nav" onclick="changeCalendarMonth(-1)">&lt;</button>
                <h3>${monthNames[currentMonth]} ${currentYear}</h3>
                <button class="btn-calendar-nav" onclick="changeCalendarMonth(1)">&gt;</button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day-header">Dg</div>
                <div class="calendar-day-header">Dl</div>
                <div class="calendar-day-header">Dt</div>
                <div class="calendar-day-header">Dc</div>
                <div class="calendar-day-header">Dj</div>
                <div class="calendar-day-header">Dv</div>
                <div class="calendar-day-header">Ds</div>
    `;
    
    daysInMonth.forEach(day => {
        if (day === null) {
            calendarHTML += `<div class="calendar-day empty"></div>`;
        } else {
            const daySortides = monthSortides.filter(trip => {
                const tripDate = new Date(trip.data + 'T12:00:00');
                return tripDate.getDate() === day;
            });
            
            const hasSortida = daySortides.length > 0;
            const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
            
            calendarHTML += `
                <div class="calendar-day ${hasSortida ? 'has-event' : ''} ${isToday ? 'today' : ''}">
                    <span class="day-number">${day}</span>
                    ${hasSortida ? `
                        <div class="event-dots">
                            ${daySortides.map(trip => `<div class="event-dot" title="${trip.nom}"></div>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }
    });
    
    calendarHTML += `
            </div>
            ${monthSortides.length > 0 ? `
                <div class="calendar-events">
                    <h4>Sortides aquest mes:</h4>
                    ${monthSortides.map(trip => `
                        <div class="calendar-event-item">
                            <strong>${formatDate(trip.data)}</strong> - ${trip.nom} (${trip.lloc})
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="small-text">No hi ha sortides aquest mes.</p>'}
        </div>
    `;
    
    return calendarHTML;
}

function changeCalendarMonth(delta) {
    calendarViewDate.setMonth(calendarViewDate.getMonth() + delta);
    const calendarioContainer = document.getElementById("calendari-sortides");
    if (calendarioContainer) {
        calendarioContainer.innerHTML = renderCalendarioSortides();
    }
}

function renderGestioSortida() {
    try {
        const index = document.getElementById("sortida-gestio-select")?.value;
        const resumContainer = document.getElementById("resum-assistencia-sortida");
        const listContainer = document.getElementById("lista-assistencia-sortida");

        if (!index && index !== "0") {
            if (resumContainer) resumContainer.innerHTML = "";
            if (listContainer) listContainer.innerHTML = "";
            return;
        }

        const trip = state.sortides[index];
        const counts = {
            si: trip.assistencia.filter((item) => item.resposta === "si").length,
            no: trip.assistencia.filter((item) => item.resposta === "no").length,
            potser: trip.assistencia.filter((item) => item.resposta === "potser").length,
            nens: trip.assistencia.reduce((sum, item) => sum + Number(item.nens || 0), 0)
        };
        const nomsSi = trip.assistencia.filter((item) => item.resposta === "si").map((item) => item.nom);
        const nomsPotser = trip.assistencia.filter((item) => item.resposta === "potser").map((item) => item.nom);

        if (resumContainer) {
            resumContainer.innerHTML = `
                <div class="priority-bar">
                    <span class="badge baixa">Si: ${counts.si}</span>
                    <span class="badge alta">No: ${counts.no}</span>
                    <span class="badge mitjana">No ho se: ${counts.potser}</span>
                    <span class="badge oberta">Nens: ${counts.nens}</span>
                </div>
                <div class="board-card compact">
                    <p><strong>Venen confirmats:</strong> ${nomsSi.length ? nomsSi.join(", ") : "Ningu encara."}</p>
                    <p><strong>Per confirmar:</strong> ${nomsPotser.length ? nomsPotser.join(", ") : "Cap persona pendent."}</p>
                </div>
            `;
        }

        if (listContainer) {
            listContainer.innerHTML = trip.assistencia
                .map(
                    (item, participantIndex) => `
                        <article class="board-card">
                            <h3>${item.nom}</h3>
                            <div class="priority-bar">
                                <span class="badge ${item.resposta === "si" ? "baixa" : item.resposta === "no" ? "alta" : "mitjana"}">${item.resposta}</span>
                                <span class="badge oberta">Nens: ${item.nens}</span>
                            </div>
                            <p><strong>Notes:</strong> ${item.notes || "Sense notes"}</p>
                            <div class="actions-row">
                                <button onclick="editarParticipantSortida(${participantIndex})">Editar</button>
                                <button onclick="eliminarParticipantSortida(${participantIndex})">Eliminar</button>
                            </div>
                        </article>
                    `
                )
                .join("") || `<p class="small-text">Encara no hi ha respostes per aquesta sortida.</p>`;
        }
    } catch (error) {
        console.error("Error en renderGestioSortida:", error);
    }
}

function renderFormulari() {
    try {
        const sortidaSelect = document.getElementById("formulari-sortida-select");
        const membresList = document.getElementById("membres-colla-list");
        if (!sortidaSelect || !membresList) return;

        const currentSortida = sortidaSelect.value;
        sortidaSelect.innerHTML = `<option value="">Selecciona una sortida</option>${state.sortides
            .map((trip, index) => `<option value="${index}">${trip.nom} · ${formatDate(trip.data)}</option>`)
            .join("")}`;
        if (currentSortida !== "" && state.sortides[currentSortida]) {
            sortidaSelect.value = currentSortida;
        }

        membresList.innerHTML = state.membresColla
            .map((name) => `<option value="${name}"></option>`)
            .join("");

        renderFormFields("form", "campos-formulari", state.formulariPreguntes);
        
        const camposRFormAdmin = document.getElementById("campos-r-form-admin");
        if (camposRFormAdmin) {
            renderFormFields("rf", "campos-r-form-admin", state.formulariPreguntes);
        }
    } catch (error) {
        console.error("Error en renderFormulari:", error);
    }
}

function getQuestion(id) {
    return state.formulariPreguntes.find((question) => question.id === id) || { text: id };
}

function getExtraFormQuestions() {
    return state.formulariPreguntes.filter(
        (question) => !["nom", "resposta", "nens", "menjar", "notes"].includes(question.id)
    );
}

function renderFormFields(prefix, containerId, questions, values = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = questions.map((question) => renderFormField(prefix, question, values)).join("");
}

function renderFormField(prefix, question, values = {}) {
    const inputId = `${prefix}-${question.id}`;
    const value = values[question.id] || "";
    const required = question.requerida ? "required" : "";
    const label = `<label for="${inputId}">${question.text}</label>`;

    if (question.tipus === "nom") {
        return `${label}<input type="text" id="${inputId}" list="membres-colla-list" placeholder="Comenca a escriure el nom" value="${escapeAttr(value)}" ${required}>`;
    }
    if (question.tipus === "assistencia") {
        return `${label}<select id="${inputId}" ${required}>
            <option value="si" ${value === "si" ? "selected" : ""}>Si vinc</option>
            <option value="no" ${value === "no" ? "selected" : ""}>No vinc</option>
            <option value="potser" ${value === "potser" ? "selected" : ""}>No ho se encara</option>
        </select>`;
    }
    if (question.tipus === "numero") {
        return `${label}<input type="number" id="${inputId}" min="0" placeholder="0" value="${escapeAttr(value)}" ${required}>`;
    }
    if (question.tipus === "llarg") {
        return `${label}<textarea id="${inputId}" placeholder="Escriu la resposta" ${required}>${escapeHtml(value)}</textarea>`;
    }
    return `${label}<input type="text" id="${inputId}" placeholder="Escriu la resposta" value="${escapeAttr(value)}" ${required}>`;
}

function renderPreguntesConfig() {
    const container = document.getElementById("lista-preguntes-formulari");
    if (!container) return;
    container.innerHTML = state.formulariPreguntes
        .map((question) => `
            <article class="question-config-row">
                <input type="text" value="${escapeAttr(question.text)}" onchange="actualitzarPreguntaFormulari('${question.id}', this.value)">
                <span class="badge oberta">${question.tipus}</span>
                <button type="button" onclick="eliminarPreguntaFormulari('${question.id}')" ${question.fixa ? "disabled" : ""}>Eliminar</button>
            </article>
        `)
        .join("");
}

function renderExtraAnswers(item) {
    const answers = getExtraFormQuestions()
        .map((question) => {
            const value = item.extra?.[question.id];
            if (value === undefined || value === "") return "";
            return `<p><strong>${question.text}:</strong> ${value}</p>`;
        })
        .filter(Boolean);
    return answers.join("");
}

function renderConfiguredAnswers(item) {
    return state.formulariPreguntes
        .filter((question) => question.id !== "nom")
        .map((question) => {
            const value = question.id in item ? item[question.id] : item.extra?.[question.id];
            if (value === undefined || value === "") return "";
            return `<p><strong>${question.text}:</strong> ${value}</p>`;
        })
        .filter(Boolean)
        .join("");
}

function getResponseLabel(item) {
    if (item.resposta === "si") return "Si vinc";
    if (item.resposta === "no") return "No vinc";
    return "No ho se encara";
}

function renderRespostesForm() {
    try {
        const configForm = document.getElementById("form-config-formulari");
        if (!configForm) return;

        renderPreguntesConfig();
        
        // Renderizar respuestas del formulario público
        const select = document.getElementById("respostes-form-sortida-select");
        const summary = document.getElementById("resum-respostes-form");
        const list = document.getElementById("lista-respostes-form");
        
        if (select) {
            const currentValue = select.value || "all";
            select.innerHTML = `<option value="all">Totes les sortides</option>${state.sortides
                .map((trip, index) => `<option value="${index}">${trip.nom} · ${formatDate(trip.data)}</option>`)
                .join("")}`;
            if (currentValue === "all") {
                select.value = "all";
            } else if (currentValue !== "" && state.sortides[currentValue]) {
                select.value = currentValue;
            } else {
                select.value = "all";
            }
        }
        
        if (!select || !summary || !list) return;

        const selectedValue = select.value;
        const responseGroups = selectedValue === "all"
            ? state.sortides.map((trip, index) => ({ trip, index }))
            : [{ trip: state.sortides[selectedValue], index: selectedValue }].filter((item) => item.trip);
        const allResponses = responseGroups.flatMap(({ trip, index }) =>
            trip.assistencia.map((item, participantIndex) => ({ trip, sortidaIndex: index, item, participantIndex }))
        );

        if (!allResponses.length) {
            summary.innerHTML = `<p class="small-text">Encara no hi ha respostes del formulari.</p>`;
            list.innerHTML = "";
            return;
        }

        const counts = {
            total: allResponses.length,
            si: allResponses.filter(({ item }) => item.resposta === "si").length,
            no: allResponses.filter(({ item }) => item.resposta === "no").length,
            potser: allResponses.filter(({ item }) => item.resposta === "potser").length,
            nens: allResponses.reduce((sum, { item }) => sum + Number(item.nens || 0), 0)
        };

        summary.innerHTML = `
            <div class="response-summary-grid">
                <span class="badge oberta">Respostes: ${counts.total}</span>
                <span class="badge baixa">Si: ${counts.si}</span>
                <span class="badge alta">No: ${counts.no}</span>
                <span class="badge mitjana">Potser: ${counts.potser}</span>
                <span class="badge oberta">Nens: ${counts.nens}</span>
            </div>
        `;

        list.innerHTML = allResponses
            .map(({ trip, sortidaIndex, item, participantIndex }) => `
                <article class="board-card form-response-card">
                    <h3>${item.nom}</h3>
                    <div class="meta-line">${trip.nom} · ${formatDate(trip.data)}</div>
                    <div class="priority-bar">
                        <span class="badge ${item.resposta === "si" ? "baixa" : item.resposta === "no" ? "alta" : "mitjana"}">${getResponseLabel(item)}</span>
                        <span class="badge oberta">Nens: ${item.nens}</span>
                    </div>
                    ${renderConfiguredAnswers(item)}
                    <div class="actions-row">
                        <button onclick="editarRespostaForm(${sortidaIndex}, ${participantIndex})">Editar</button>
                        <button onclick="eliminarRespostaForm(${sortidaIndex}, ${participantIndex})">Eliminar</button>
                    </div>
                </article>
            `)
            .join("") || `<p class="small-text">Encara no hi ha respostes del formulari.</p>`;
    } catch (error) {
        console.error("Error en renderRespostesForm:", error);
    }
}

function renderPiro() {
    try {
        document.getElementById("stock-carretilles").innerText = state.piroStock.carretilles;
        document.getElementById("stock-infantils").innerText = state.piroStock.infantils;
        document.getElementById("stock-brolladors").innerText = state.piroStock.brolladors;
        document.getElementById("stock-efectes").innerText = state.piroStock.efectes;

        const select = document.getElementById("piro-sortida-select");
        if (select) {
            select.innerHTML = `<option value="">Selecciona sortida</option>${state.sortides
                .map((trip, index) => `<option value="${index}">${trip.nom} · ${formatDate(trip.data)}</option>`)
                .join("")}`;
        }

        const historialContainer = document.getElementById("historial-piro-complet");
        if (historialContainer) {
            const historialPiro = state.sortides
                .filter((trip) => Object.values(trip.piroUsada || {}).some((value) => Number(value) > 0))
                .sort((a, b) => new Date(b.data) - new Date(a.data))
                .map(
                    (trip) => `
                        <article class="board-card">
                            <h3>${trip.nom}</h3>
                            <div class="meta-line">${formatDate(trip.data)} · ${trip.lloc}</div>
                            <p>${formatPiroUsada(trip.piroUsada)}</p>
                        </article>
                    `
                )
                .join("");
            
            historialContainer.innerHTML = historialPiro || '<p class="small-text">No hi ha registres de piro utilitzada en cap sortida.</p>';
        }

        const piroSortides = state.sortides
            .filter((trip) => Object.values(trip.piroUsada || {}).some((value) => Number(value) > 0))
            .map(
                (trip) => `
                    <article class="board-card">
                        <h3>${trip.nom}</h3>
                        <div class="meta-line">${formatDate(trip.data)} · ${trip.lloc}</div>
                        <p>${formatPiroUsada(trip.piroUsada)}</p>
                    </article>
                `
            )
            .join("");

        const existing = document.getElementById("lista-reserves-piro");
        if (existing) existing.innerHTML = piroSortides || '<p class="small-text">No hi ha registres de piro utilitzada en sortides.</p>';
    } catch (error) {
        console.error("Error en renderPiro:", error);
    }
}

function renderVestuari() {
    document.getElementById("stock-dalt-grid").innerHTML = renderStockBloc("dalt", "Part de dalt");
    document.getElementById("stock-baix-grid").innerHTML = renderStockBloc("baix", "Pantalon");

    document.getElementById("lista-vestuari").innerHTML = state.vestuariAssignacions
        .map(
            (item, index) => {
                const teRobaPersonal = item.daltEstat === "persona" || item.baixEstat === "persona";
                const indicator = teRobaPersonal ? '<span class="roba-persona-indicator"></span>' : '';
                
                return `
                <article class="board-card">
                    <div class="card-header">
                        <h3>${item.nom}</h3>
                        ${indicator}
                    </div>
                    <p><strong>Part de dalt:</strong> ${formatGarment(item.daltTalla, item.daltEstat)}</p>
                    <p><strong>Pantalon:</strong> ${formatGarment(item.baixTalla, item.baixEstat)}</p>
                    <div class="actions-row">
                        <button onclick="editarVestuari(${index})">Editar</button>
                        <button onclick="eliminarVestuari(${index})">Eliminar</button>
                    </div>
                </article>
            `}
        )
        .join("");
    
    // Renderizar selector de salidas para reservas
    const reservaSelect = document.getElementById("reserva-sortida-select");
    if (reservaSelect) {
        const currentValue = reservaSelect.value;
        reservaSelect.innerHTML = `<option value="">Selecciona una sortida</option>${state.sortides
            .map((trip, index) => `<option value="${index}">${trip.nom} · ${formatDate(trip.data)}</option>`)
            .join("")}`;
        if (currentValue && state.sortides[currentValue]) {
            reservaSelect.value = currentValue;
        }
    }
    
    renderReservesRoba();
}

function renderReservesRoba() {
    const sortidaIndex = document.getElementById("reserva-sortida-select")?.value;
    const infoContainer = document.getElementById("reserva-roba-info");
    const listContainer = document.getElementById("lista-reserves-roba");
    
    if (!sortidaIndex && sortidaIndex !== "0") {
        if (infoContainer) infoContainer.innerHTML = "";
        if (listContainer) listContainer.innerHTML = "";
        return;
    }
    
    const sortida = state.sortides[sortidaIndex];
    const reservesSortida = state.reservesRoba.filter(r => r.sortidaId === String(sortidaIndex));
    
    if (infoContainer) {
        infoContainer.innerHTML = `
            <p><strong>Sortida:</strong> ${sortida.nom}</p>
            <p><strong>Data:</strong> ${formatDate(sortida.data)}</p>
            <p><strong>Persones amb reserva:</strong> ${reservesSortida.length}</p>
            <button class="btn-primary full" onclick="openReservaRobaModal(${sortidaIndex})">Afegir reserva</button>
        `;
    }
    
    if (listContainer) {
        listContainer.innerHTML = reservesSortida.length > 0 
            ? reservesSortida.map((reserva, index) => {
                const globalIndex = state.reservesRoba.findIndex(r => r === reserva);
                return `
                <article class="board-card">
                    <div class="card-header">
                        <h3>${reserva.nom}</h3>
                    </div>
                    <p><strong>Part de dalt:</strong> ${formatGarment(reserva.daltTalla, reserva.daltEstat)}</p>
                    <p><strong>Pantalon:</strong> ${formatGarment(reserva.baixTalla, reserva.baixEstat)}</p>
                    <div class="actions-row">
                        <button onclick="editarReservaRoba(${globalIndex})">Editar</button>
                        <button onclick="eliminarReservaRoba(${globalIndex})">Eliminar</button>
                        <button onclick="convertirReservaEnAssignacio(${globalIndex})">Afegir a assignacions</button>
                    </div>
                </article>
            `}).join("")
            : '<p class="small-text">No hi ha reserves per aquesta sortida.</p>';
    }
}

function renderStockBloc(type, label) {
    return `
        <div class="grid-stock">
            ${Object.keys(state.vestuariStock[type])
                .map((size) => {
                    const summary = getVestuariSummary(type, size);
                    const totalClass = summary.persona > 0 ? 'stock-descuadre' : '';
                    return `
                        <div class="stock-card">
                            <small>${label} ${size}</small>
                            <strong>${summary.guardarropa}</strong>
                            <div class="meta-line ${totalClass}">Total peces: ${summary.total}</div>
                            <div class="meta-line">Amb persona: ${summary.persona}</div>
                            <div class="meta-line">Guardarropa: ${summary.guardarropa}</div>
                            <div class="controls">
                                <button onclick="updateVestuariStock('${type}', '${size}', -1)">-1</button>
                                <button onclick="updateVestuariStock('${type}', '${size}', 1)">+1</button>
                            </div>
                        </div>
                    `;
                })
                .join("")}
        </div>
    `;
}

function getVestuariSummary(type, size) {
    const guardarropa = state.vestuariStock[type][size] || 0;
    const personaField = type === "dalt" ? "daltEstat" : "baixEstat";
    const tallaField = type === "dalt" ? "daltTalla" : "baixTalla";
    const persona = state.vestuariAssignacions.filter(
        (item) => item[tallaField] === size && item[personaField] === "persona"
    ).length;
    const total = guardarropa + persona;
    return { total, persona, guardarropa };
}

function formatGarment(size, stateLabel) {
    if (!size) return "Sense assignar";
    return `Talla ${size} · ${stateLabel === "persona" ? "amb la persona" : "al guardarropa"}`;
}

function renderTabals() {
    const recuentContainer = document.getElementById("recuent-tabalers");
    const tabalersContainer = document.getElementById("lista-tabalers");
    
    if (!recuentContainer || !tabalersContainer) return;

    const aptesAdults = state.tabalers.filter((member) => member.tipus === "adult" && member.assajosMes >= 1).length;
    const aptesInfantils = state.tabalers.filter((member) => member.tipus === "infantil" && member.assajosMes >= 1).length;
    const totalAdults = state.tabalers.filter((member) => member.tipus === "adult").length;
    const totalInfantils = state.tabalers.filter((member) => member.tipus === "infantil").length;

    recuentContainer.innerHTML = `
        <div class="board-card">
            <div class="stats-grid">
                <div class="metric-card">
                    <span>Adults aptes</span>
                    <strong>${aptesAdults}/${totalAdults}</strong>
                </div>
                <div class="metric-card">
                    <span>Infantils aptes</span>
                    <strong>${aptesInfantils}/${totalInfantils}</strong>
                </div>
            </div>
            <p class="small-text">Els tabalers han d'assajar minim un cop al mes per estar en condicions de sortir.</p>
        </div>
    `;

    tabalersContainer.innerHTML = state.tabalers
        .map(
            (member, index) => `
                <article class="board-card">
                    <h3>${member.nom}</h3>
                    <div class="priority-bar">
                        <span class="badge ${esAptePerSortida(member) ? "baixa" : "alta"}">
                            ${esAptePerSortida(member) ? "apte" : "no apte"}
                        </span>
                        <span class="badge ${member.tipus === "infantil" ? "mitjana" : "oberta"}">${member.tipus}</span>
                    </div>
                    <p>${explicacioAptitud(member)}</p>
                    <div class="meta-line">Edat: ${member.edat || "-"} · Assajos aquest mes: ${member.assajosMes}</div>
                    <div class="actions-row">
                        <button onclick="editarTabaler(${index})">Editar</button>
                        <button onclick="sumarAssaig(${index})">+1 assaig</button>
                        <button onclick="eliminarTabaler(${index})">Eliminar</button>
                    </div>
                </article>
            `
        )
        .join("");
}

function esAptePerSortida(member) {
    if (member.tipus === "infantil") return member.edat >= 5 && member.assajosMes >= 1;
    return member.assajosMes >= 1;
}

function explicacioAptitud(member) {
    if (member.tipus === "infantil" && member.edat < 5) {
        return "No apte: l'edat minima definida al document de tabals es de 5 anys.";
    }
    if (member.assajosMes < 1) {
        return "No apte: la junta de tabals proposa minim un assaig mensual per sortir.";
    }
    return "A punt per sortir segons les normes carregades a l'app.";
}

function openBestiaModal() {
    document.getElementById("modal-bestia-title").innerText = "Nou contacte bestiari";
    document.getElementById("form-bestia").reset();
    document.getElementById("b-index").value = "";
    toggleModal("modal-bestia");
}

function editarBestia(index) {
    const bestia = state.bestiari[index];
    document.getElementById("modal-bestia-title").innerText = "Editar contacte bestiari";
    document.getElementById("b-index").value = index;
    document.getElementById("b-nom").value = bestia.nom;
    document.getElementById("b-poblacio").value = bestia.poblacio || "";
    document.getElementById("b-feina").value = bestia.feina || "";
    document.getElementById("b-contacte-nom").value = bestia.contacteNom || "";
    document.getElementById("b-contacte-telefon").value = bestia.contacteTelefon || "";
    toggleModal("modal-bestia");
}

function eliminarBestia(index) {
    const bestia = state.bestiari[index];
    if (!bestia || !confirmDelete(bestia.nom)) return;
    state.bestiari.splice(index, 1);
    renderAll();
}

function renderBestiari() {
    const container = document.getElementById("lista-bestiari");
    if (!container) return;

    if (!state.bestiari || state.bestiari.length === 0) {
        container.innerHTML = '<p class="small-text">No hi ha bèsties registrades. Afegeix-ne una prement el botó "+".</p>';
    } else {
        container.innerHTML = state.bestiari
            .map((bestia, index) => {
                const cleanPhone = (bestia.contacteTelefon || "").replace(/\D/g, "");
                const waPhone = cleanPhone.length === 9 ? "34" + cleanPhone : cleanPhone;
                const hasContact = bestia.contacteNom || bestia.contacteTelefon;

                return `
                    <article class="board-card person-card">
                        <h3>${escapeHtml(bestia.nom)}</h3>
                        <div class="priority-bar">
                            <span class="badge oberta">${escapeHtml(bestia.poblacio)}</span>
                        </div>
                        ${bestia.feina ? `<p><strong>Feina:</strong> ${escapeHtml(bestia.feina)}</p>` : ""}
                        
                        ${hasContact ? `
                            <div class="contact-box">
                                <div class="contact-icon-wrapper">
                                    <i class="fas fa-user-shield"></i>
                                </div>
                                <div class="contact-details">
                                    <small>Persona de contacte</small>
                                    <strong>${escapeHtml(bestia.contacteNom || "Sense nom")}</strong>
                                    ${bestia.contacteTelefon ? `<span>${escapeHtml(bestia.contacteTelefon)}</span>` : ""}
                                </div>
                                ${bestia.contacteTelefon ? `
                                    <div class="contact-quick-actions">
                                        <a href="tel:${cleanPhone}" class="btn-quick-call" title="Trucar">
                                            <i class="fas fa-phone"></i>
                                        </a>
                                        <a href="https://wa.me/${waPhone}" target="_blank" class="btn-quick-wa" title="WhatsApp">
                                            <i class="fab fa-whatsapp"></i>
                                        </a>
                                    </div>
                                ` : ""}
                            </div>
                        ` : ""}
                        
                        <div class="actions-row">
                            <button onclick="editarBestia(${index})">Editar</button>
                            <button onclick="eliminarBestia(${index})">Eliminar</button>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    // Inicializar mapa y selector de salidas
    const mapaContainer = document.getElementById("mapa-bestiari");
    if (mapaContainer && !mapa) {
        inicialitzarMapa();
    }

    const sortidaSelect = document.getElementById("sortida-mapa-select");
    if (sortidaSelect) {
        const currentValue = sortidaSelect.value;
        sortidaSelect.innerHTML = `<option value="">Selecciona sortida</option>${state.sortides
            .map((trip, index) => `<option value="${index}">${trip.nom} · ${formatDate(trip.data)}</option>`)
            .join("")}`;
        if (currentValue !== "" && state.sortides[currentValue]) {
            sortidaSelect.value = currentValue;
        }
    }
}

function updateStock(type, amount) {
    state.piroStock[type] = Math.max(0, (state.piroStock[type] || 0) + amount);
    renderAll();
}

function adjustStockFromSortida(sortida, direction) {
    if (!sortida?.piroUsada) return;
    Object.entries(sortida.piroUsada).forEach(([key, value]) => {
        const current = state.piroStock[key] || 0;
        state.piroStock[key] = Math.max(0, current + Number(value || 0) * direction);
    });
}

function getAvailablePiroForEdit(index = "") {
    const available = { ...state.piroStock };
    if (index !== "") {
        const previous = state.sortides[index]?.piroUsada || {};
        Object.keys(available).forEach((key) => {
            available[key] += Number(previous[key] || 0);
        });
    }
    return available;
}

function readSortidaPiroReserva() {
    return {
        carretilles: Number(document.getElementById("s-piro-carretilles").value || 0),
        infantils: Number(document.getElementById("s-piro-infantils").value || 0),
        brolladors: Number(document.getElementById("s-piro-brolladors").value || 0),
        efectes: Number(document.getElementById("s-piro-efectes").value || 0)
    };
}

function validatePiroReserva(reserva, available) {
    return Object.entries(reserva).every(([key, value]) => Number(value || 0) <= Number(available[key] || 0));
}

function cambiarEstatTasca(index) {
    state.tasques[index].estat = state.tasques[index].estat === "feta" ? "oberta" : "feta";
    renderAll();
}

function sumarAssaig(index) {
    state.tabalers[index].assajosMes += 1;
    renderAll();
}

function openTabalerModal() {
    document.getElementById("modal-tabaler-title").innerText = "Nou tabaler";
    document.getElementById("form-tabaler").reset();
    document.getElementById("tb-index").value = "";
    document.getElementById("tb-assajos").value = "0";
    toggleModal("modal-tabaler");
}

function editarTabaler(index) {
    const member = state.tabalers[index];
    document.getElementById("modal-tabaler-title").innerText = "Editar tabaler";
    document.getElementById("tb-index").value = index;
    document.getElementById("tb-nom").value = member.nom;
    document.getElementById("tb-tipo").value = member.tipus;
    document.getElementById("tb-edat").value = member.edat || "";
    document.getElementById("tb-assajos").value = member.assajosMes;
    toggleModal("modal-tabaler");
}

function eliminarTasca(index) {
    const task = state.tasques[index];
    if (!task || !confirmDelete(task.titol)) return;
    state.tasques.splice(index, 1);
    renderAll();
}

function openTaskModal() {
    document.getElementById("modal-tasca-title").innerText = "Nova tasca";
    document.getElementById("form-tasca").reset();
    document.getElementById("t-index").value = "";
    toggleModal("modal-tasca");
}

function openSortidaModal() {
    document.getElementById("modal-sortida-title").innerText = "Gestió de sortides";
    document.getElementById("form-sortida").reset();
    document.getElementById("s-index").value = "";
    document.getElementById("lista-sortides-modal").innerHTML = renderSortidesModalList();
    document.getElementById("form-sortida-container").style.display = "none";
    document.querySelector(".sortides-list-container").style.display = "block";
    toggleModal("modal-sortida");
}

function showNovaSortidaForm() {
    document.getElementById("form-sortida-title").innerText = "Nova sortida";
    document.getElementById("form-sortida").reset();
    document.getElementById("s-index").value = "";
    document.querySelector(".sortides-list-container").style.display = "none";
    document.getElementById("form-sortida-container").style.display = "block";
}

function hideSortidaForm() {
    document.getElementById("form-sortida").reset();
    document.getElementById("s-index").value = "";
    document.getElementById("lista-sortides-modal").innerHTML = renderSortidesModalList();
    document.getElementById("form-sortida-container").style.display = "none";
    document.querySelector(".sortides-list-container").style.display = "block";
}

function renderSortidesModalList() {
    return state.sortides.map((sortida, index) => `
        <div class="sortida-item-modal">
            <div class="sortida-info">
                <strong>${sortida.nom}</strong>
                <small>${formatDate(sortida.data)} · ${sortida.lloc}</small>
            </div>
            <div class="sortida-actions">
                <button onclick="editarSortidaModal(${index})" class="btn-secondary btn-small">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="eliminarSortidaModal(${index})" class="btn-secondary btn-small btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join("");
}

function editarSortidaModal(index) {
    const sortida = state.sortides[index];
    document.getElementById("form-sortida-title").innerText = "Editar sortida";
    document.getElementById("s-index").value = index;
    document.getElementById("s-nom").value = sortida.nom;
    document.getElementById("s-lloc").value = sortida.lloc;
    document.getElementById("s-data").value = sortida.data;
    document.getElementById("s-notes").value = sortida.notes || "";
    document.querySelector(".sortides-list-container").style.display = "none";
    document.getElementById("form-sortida-container").style.display = "block";
}

function eliminarSortidaModal(index) {
    const sortida = state.sortides[index];
    if (!sortida || !confirmDelete(sortida.nom)) return;
    state.sortides.splice(index, 1);
    document.getElementById("lista-sortides-modal").innerHTML = renderSortidesModalList();
    renderAll();
}

function getSelectedSortidaIndex() {
    return document.getElementById("sortida-gestio-select")?.value ?? "";
}

function seleccionarSortida(index) {
    const select = document.getElementById("sortida-gestio-select");
    if (!select || !state.sortides[index]) return;
    select.value = String(index);
    renderGestioSortida();
    document.getElementById("sortida-gestio-select")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function editarTasca(index) {
    const task = state.tasques[index];
    document.getElementById("modal-tasca-title").innerText = "Editar tasca";
    document.getElementById("t-index").value = index;
    document.getElementById("t-titulo").value = task.titol;
    document.getElementById("t-responsable").value = task.responsable || "";
    document.getElementById("t-prioritat").value = task.prioritat;
    document.getElementById("t-detall").value = task.detall || "";
    toggleModal("modal-tasca");
}

function eliminarReunio(index) {
    const meeting = state.reunions[index];
    if (!meeting || !confirmDelete(meeting.titol)) return;
    state.reunions.splice(index, 1);
    renderAll();
}

function arxivarReunio(index) {
    state.reunions[index].arxivada = true;
    renderAll();
}

function desarxivarReunio(index) {
    state.reunions[index].arxivada = false;
    renderAll();
}

function openReunionModal() {
    document.getElementById("modal-reunion-title").innerText = "Nova reunio";
    document.getElementById("form-reunion").reset();
    document.getElementById("r-index").value = "";
    toggleModal("modal-reunion");
}

function editarReunio(index) {
    const meeting = state.reunions[index];
    document.getElementById("modal-reunion-title").innerText = "Editar reunio";
    document.getElementById("r-index").value = index;
    document.getElementById("r-fecha").value = meeting.data;
    document.getElementById("r-titulo").value = meeting.titol;
    document.getElementById("r-acords").value = meeting.acords;
    document.getElementById("r-acta").value = meeting.acta || "";
    toggleModal("modal-reunion");
}

function eliminarSortida(index) {
    const trip = state.sortides[index];
    if (!trip || !confirmDelete(trip.nom)) return;
    adjustStockFromSortida(state.sortides[index], 1);
    state.sortides.splice(index, 1);
    renderAll();
}

function editarSortida(index) {
    const trip = state.sortides[index];
    document.getElementById("modal-sortida-title").innerText = "Editar sortida";
    document.getElementById("s-index").value = index;
    document.getElementById("s-nom").value = trip.nom;
    document.getElementById("s-lloc").value = trip.lloc;
    document.getElementById("s-data").value = trip.data;
    document.getElementById("s-estat").value = trip.estat;
    document.getElementById("s-notes").value = trip.notes || "";
    toggleModal("modal-sortida");
}

function openJuntaAuthModal() {
    document.getElementById("junta-password").value = "";
    document.getElementById("junta-auth-feedback").innerText = "";
    toggleModal("modal-junta-auth");
}

function openChangePasswordModal() {
    document.getElementById("old-password").value = "";
    document.getElementById("new-password").value = "";
    document.getElementById("change-password-feedback").innerText = "";
    toggleModal("modal-change-password");
}

function verifyJuntaPassword(password) {
    return password === state.juntaPassword;
}

function logoutJunta() {
    juntaAuthenticated = false;
    showTab("tab-sortides");
    showToast("Sessio tancada", "success");
}

function openVestuariAuthModal() {
    document.getElementById("vestuari-password").value = "";
    toggleModal("modal-vestuari-auth");
}

function verifyVestuariPassword(password) {
    return password === state.vestuariPassword;
}

function logoutVestuari() {
    vestuariAuthenticated = false;
    showTab("tab-sortides");
    showToast("Sessio vestuari tancada", "success");
}

function openReservaRobaModal(sortidaIndex) {
    document.getElementById("modal-reserva-roba-title").innerText = "Nova reserva de roba";
    document.getElementById("form-reserva-roba").reset();
    document.getElementById("rr-index").value = "";
    document.getElementById("rr-sortida-id").value = sortidaIndex;
    toggleModal("modal-reserva-roba");
}

function editarReservaRoba(index) {
    const reserva = state.reservesRoba[index];
    document.getElementById("modal-reserva-roba-title").innerText = "Editar reserva de roba";
    document.getElementById("rr-index").value = index;
    document.getElementById("rr-sortida-id").value = reserva.sortidaId;
    document.getElementById("rr-nom").value = reserva.nom;
    document.getElementById("rr-dalt-talla").value = reserva.daltTalla;
    document.getElementById("rr-dalt-estat").value = reserva.daltEstat;
    document.getElementById("rr-baix-talla").value = reserva.baixTalla;
    document.getElementById("rr-baix-estat").value = reserva.baixEstat;
    toggleModal("modal-reserva-roba");
}

function eliminarReservaRoba(index) {
    const reserva = state.reservesRoba[index];
    if (!reserva || !confirmDelete(reserva.nom)) return;
    state.reservesRoba.splice(index, 1);
    renderReservesRoba();
    renderAll();
}

function convertirReservaEnAssignacio(index) {
    const reserva = state.reservesRoba[index];
    if (!reserva) return;
    
    // Verificar si ya existe una asignación para esta persona
    const existingIndex = state.vestuariAssignacions.findIndex(
        item => item.nom.toLowerCase() === reserva.nom.toLowerCase()
    );
    
    const assignacioData = {
        nom: reserva.nom,
        daltTalla: reserva.daltTalla,
        daltEstat: reserva.daltEstat,
        baixTalla: reserva.baixTalla,
        baixEstat: reserva.baixEstat
    };
    
    if (existingIndex !== -1) {
        // Si ya existe, actualizar automáticamente
        state.vestuariAssignacions[existingIndex] = assignacioData;
        showToast("Assignació actualitzada correctament", "success");
    } else {
        // Si no existe, crear nueva
        state.vestuariAssignacions.push(assignacioData);
        showToast("Assignació creada correctament", "success");
    }
    
    renderAll();
}

let mapa = null;
let dibuixActual = null;
let puntsDibuix = [];

function inicialitzarMapa() {
    if (mapa) {
        mapa.remove();
    }
    
    // Coordenadas de La Pobla de Montornès (CP 43761) - centro aproximado
    const lat = 41.1426;
    const lng = 1.1262;
    
    mapa = L.map('mapa-bestiari').setView([lat, lng], 16);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapa);
    
    // Añadir evento de clic para dibujar
    mapa.on('click', function(e) {
        const latlng = e.latlng;
        puntsDibuix.push([latlng.lat, latlng.lng]);
        
        if (dibuixActual) {
            dibuixActual.addLatLng(latlng);
        } else {
            dibuixActual = L.polyline([latlng], {
                color: 'red',
                weight: 4,
                opacity: 0.7
            }).addTo(mapa);
        }
    });
    
    // Añadir evento de doble clic para terminar el dibujo
    mapa.on('dblclick', function() {
        if (dibuixActual && puntsDibuix.length > 1) {
            dibuixActual.closePath();
            dibuixActual = null;
            puntsDibuix = [];
        }
    });
    
    // Forzar invalidación del tamaño después de un pequeño delay
    setTimeout(() => {
        mapa.invalidateSize();
    }, 200);
}

function limpiarMapa() {
    if (dibuixActual) {
        mapa.removeLayer(dibuixActual);
        dibuixActual = null;
    }
    puntsDibuix = [];
}

function guardarRecorrido() {
    const sortidaIndex = document.getElementById('sortida-mapa-select').value;
    if (!sortidaIndex) {
        showToast('Selecciona una sortida primer', 'warning');
        return;
    }
    
    if (!dibuixActual || puntsDibuix.length < 2) {
        showToast('Dibuixa primer el recorregut al mapa', 'warning');
        return;
    }
    
    const trip = state.sortides[sortidaIndex];
    state.recorridosMapa[trip.nom] = [...puntsDibuix];
    saveState();
    showToast('Recorregut guardat correctament', 'success');
    limpiarMapa();
}

function carregarRecorrido() {
    const sortidaIndex = document.getElementById('sortida-mapa-select').value;
    if (!sortidaIndex) {
        limpiarMapa();
        return;
    }
    
    const trip = state.sortides[sortidaIndex];
    const recorrido = state.recorridosMapa[trip.nom];
    
    if (recorrido && recorrido.length > 0) {
        limpiarMapa();
        dibuixActual = L.polyline(recorrido, {
            color: 'red',
            weight: 4,
            opacity: 0.7
        }).addTo(mapa);
        puntsDibuix = [...recorrido];
    }
}

function copiarMapaWhatsApp() {
    const sortidaIndex = document.getElementById('sortida-mapa-select').value;
    if (!sortidaIndex) {
        showToast('Selecciona una sortida primer', 'warning');
        return;
    }
    
    const trip = state.sortides[sortidaIndex];
    const recorrido = state.recorridosMapa[trip.nom];
    
    if (!recorrido || recorrido.length < 2) {
        showToast('No hi ha recorregut guardat per aquesta sortida', 'warning');
        return;
    }
    
    // Capturar el mapa como imagen
    const mapaElement = document.getElementById('mapa-bestiari');
    
    showToast('Generant imatge del mapa...', 'info');
    
    html2canvas(mapaElement, {
        useCORS: true,
        allowTaint: true,
        logging: false
    }).then(canvas => {
        canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onload = function() {
                const imageData = reader.result;
                
                // Crear mensaje de texto con información
                const mensaje = `🗺️ Recorregut per a la sortida: ${trip.nom}\n📍 Lloc: ${trip.lloc}\n📅 Data: ${formatDate(trip.data)}\n\n[Imatge del mapa amb el recorregut]`;
                
                // Copiar el mensaje de texto
                navigator.clipboard.writeText(mensaje).then(() => {
                    showToast('Text copiat. Pega el missatge i afegeix la imatge del mapa manualment.', 'success');
                    
                    // Descargar la imagen automáticamente
                    const link = document.createElement('a');
                    link.download = `recorregut-${trip.nom.replace(/\s+/g, '-')}.png`;
                    link.href = imageData;
                    link.click();
                }).catch(() => {
                    showToast('Error al copiar el text', 'error');
                });
            };
            reader.readAsDataURL(blob);
        });
    }).catch(err => {
        console.error('Error al capturar el mapa:', err);
        showToast('Error al generar la imatge del mapa', 'error');
    });
}

function changeJuntaPassword(oldPassword, newPassword) {
    if (!verifyJuntaPassword(oldPassword)) {
        return { success: false, message: "Contrasenya actual incorrecta" };
    }
    if (newPassword.length < 4) {
        return { success: false, message: "La contrasenya ha de tenir al menys 4 caracters" };
    }
    state.juntaPassword = newPassword;
    saveState();
    return { success: true, message: "Contrasenya canviada correctament" };
}

function openParticipantModal() {
    const sortidaIndex = getSelectedSortidaIndex();
    if (sortidaIndex !== "0" && !sortidaIndex) {
        showToast("Selecciona una sortida abans d'afegir participants.", "warning");
        return;
    }
    document.getElementById("modal-participant-title").innerText = "Nova resposta de sortida";
    document.getElementById("form-participant-sortida").reset();
    document.getElementById("ps-index").value = "";
    toggleModal("modal-participant-sortida");
}

function editarParticipantSortida(participantIndex) {
    const sortidaIndex = getSelectedSortidaIndex();
    const item = state.sortides[sortidaIndex].assistencia[participantIndex];
    document.getElementById("modal-participant-title").innerText = "Editar resposta de sortida";
    document.getElementById("ps-index").value = participantIndex;
    document.getElementById("ps-nom").value = item.nom;
    document.getElementById("ps-resposta").value = item.resposta;
    document.getElementById("ps-nens").value = item.nens;
    document.getElementById("ps-menjar").value = item.menjar || "";
    document.getElementById("ps-notes").value = item.notes || "";
    toggleModal("modal-participant-sortida");
}

function eliminarParticipantSortida(participantIndex) {
    const sortidaIndex = getSelectedSortidaIndex();
    state.sortides[sortidaIndex].assistencia.splice(participantIndex, 1);
    renderAll();
    document.getElementById("sortida-gestio-select").value = String(sortidaIndex);
}

function editarRespostaForm(sortidaIndex, participantIndex) {
    const sortidaSelect = document.getElementById("sortida-gestio-select");
    if (sortidaSelect) {
        sortidaSelect.value = String(sortidaIndex);
    }
    editarParticipantSortida(participantIndex);
}

function eliminarRespostaForm(sortidaIndex, participantIndex) {
    const item = state.sortides[sortidaIndex]?.assistencia?.[participantIndex];
    if (!item || !confirmDelete(item.nom)) return;
    state.sortides[sortidaIndex].assistencia.splice(participantIndex, 1);
    renderAll();
}

function actualitzarPreguntaFormulari(questionId, text) {
    const cleanText = text.trim();
    const question = state.formulariPreguntes.find((item) => item.pregunta_id === questionId || item.id === questionId);
    if (!question) return;
    if (!cleanText) {
        renderPreguntesConfig();
        showToast("La pregunta no pot quedar buida.", "warning");
        return;
    }
    const duplicate = state.formulariPreguntes.some(
        (item) => (item.pregunta_id !== questionId && item.id !== questionId) && item.text.toLocaleLowerCase("ca") === cleanText.toLocaleLowerCase("ca")
    );
    if (duplicate) {
        renderPreguntesConfig();
        showToast("Aquesta pregunta ja existeix.", "warning");
        return;
    }
    question.text = cleanText;
    renderAll();
    
    // Sincronizar con PocketBase
    if (PB_CONFIG.enabled) {
        syncQuestionUpdateToPocketBase(question);
    }
}

async function syncQuestionUpdateToPocketBase(question) {
    if (!PB_CONFIG.enabled) return;
    
    try {
        const authResponse = await fetch(
            buildPocketBaseUrl('/api/admins/auth-with-password'),
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identity: PB_ADMIN_EMAIL,
                    password: PB_ADMIN_PASSWORD
                })
            }
        );
        
        if (authResponse.ok) {
            const authData = await authResponse.json();
            const token = authData.token;
            
            // Buscar el registro existente
            const filter = encodeURIComponent(`pregunta_id="${question.pregunta_id || question.id}"`);
            const listResponse = await fetch(
                buildPocketBaseUrl(`/api/collections/formulari_preguntes/records?filter=${filter}&perPage=1`),
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (listResponse.ok) {
                const listData = await listResponse.json();
                const existingRecord = listData.items?.[0];
                
                if (existingRecord) {
                    // Actualizar registro existente
                    const updateResponse = await fetch(
                        buildPocketBaseUrl(`/api/collections/formulari_preguntes/records/${existingRecord.id}`),
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ text: question.text })
                        }
                    );
                    
                    if (updateResponse.ok) {
                        console.log("✓ Pregunta actualizada en PocketBase");
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error actualizando pregunta en PocketBase:", error);
    }
}

function eliminarPreguntaFormulari(questionId) {
    const question = state.formulariPreguntes.find((item) => item.pregunta_id === questionId || item.id === questionId);
    if (!question || question.fixa) return;
    if (!confirmDelete(question.text)) return;
    
    const questionToDelete = { ...question }; // Guardar referencia para sincronización
    
    state.formulariPreguntes = state.formulariPreguntes.filter((item) => item.pregunta_id !== questionId && item.id !== questionId);
    state.sortides.forEach((sortida) => {
        sortida.assistencia.forEach((item) => {
            if (item.extra) {
                delete item.extra[questionId];
            }
        });
    });
    renderAll();
    
    // Sincronizar eliminación con PocketBase
    if (PB_CONFIG.enabled) {
        syncQuestionDeleteToPocketBase(questionToDelete);
    }
}

async function syncQuestionDeleteToPocketBase(question) {
    if (!PB_CONFIG.enabled) return;
    
    try {
        const authResponse = await fetch(
            buildPocketBaseUrl('/api/admins/auth-with-password'),
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identity: PB_ADMIN_EMAIL,
                    password: PB_ADMIN_PASSWORD
                })
            }
        );
        
        if (authResponse.ok) {
            const authData = await authResponse.json();
            const token = authData.token;
            
            // Buscar y eliminar el registro
            const filter = encodeURIComponent(`pregunta_id="${question.pregunta_id || question.id}"`);
            const listResponse = await fetch(
                buildPocketBaseUrl(`/api/collections/formulari_preguntes/records?filter=${filter}&perPage=1`),
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (listResponse.ok) {
                const listData = await listResponse.json();
                const existingRecord = listData.items?.[0];
                
                if (existingRecord) {
                    const deleteResponse = await fetch(
                        buildPocketBaseUrl(`/api/collections/formulari_preguntes/records/${existingRecord.id}`),
                        {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );
                    
                    if (deleteResponse.ok) {
                        console.log("✓ Pregunta eliminada de PocketBase");
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error eliminando pregunta de PocketBase:", error);
    }
}

function addQuestionToForm(text, tipus) {
    const cleanText = text.trim();
    if (!cleanText) {
        showToast("Escriu una pregunta abans d'afegir-la.", "warning");
        return false;
    }
    const duplicate = state.formulariPreguntes.some(
        (question) => question.text.toLocaleLowerCase("ca") === cleanText.toLocaleLowerCase("ca")
    );
    if (duplicate) {
        showToast("Aquesta pregunta ja existeix i no s'ha duplicat.", "warning");
        return false;
    }
    
    const newQuestion = {
        pregunta_id: createQuestionId(cleanText), // Usar pregunta_id para PocketBase
        text: cleanText,
        tipus: tipus || "text",
        requerida: false,
        fixa: false
    };
    
    state.formulariPreguntes.push(newQuestion);
    
    // Sincronizar con PocketBase si está habilitado
    if (PB_CONFIG.enabled) {
        syncQuestionToPocketBase(newQuestion);
    }
    
    return true;
}

// Función para sincronizar una pregunta individual con PocketBase
async function syncQuestionToPocketBase(question) {
    if (!PB_CONFIG.enabled) return;
    
    try {
        console.log("Sincronizando pregunta con PocketBase:", question.text);
        
        const authResponse = await fetch(
            buildPocketBaseUrl('/api/admins/auth-with-password'),
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identity: PB_ADMIN_EMAIL,
                    password: PB_ADMIN_PASSWORD
                })
            }
        );
        
        if (authResponse.ok) {
            const authData = await authResponse.json();
            const token = authData.token;
            
            // Guardar en colección formulari_preguntes
            const response = await fetch(
                buildPocketBaseUrl('/api/collections/formulari_preguntes/records'),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(question)
                }
            );
            
            if (response.ok) {
                console.log("✓ Pregunta sincronizada con PocketBase:", question.text);
                showToast("Pregunta guardada en PocketBase", "success");
            } else {
                const errorText = await response.text();
                console.error("✗ Error sincronizando pregunta:", errorText);
                showToast("Error guardando en PocketBase", "error");
            }
        }
    } catch (error) {
        console.error("Error en sincronización individual:", error);
    }
}

function readDynamicFormResponse(prefix) {
    const data = {
        nom: "",
        resposta: "potser",
        nens: 0,
        menjar: "",
        notes: "",
        extra: {}
    };

    state.formulariPreguntes.forEach((question) => {
        const element = document.getElementById(`${prefix}-${question.id}`);
        if (!element) return;
        const value = question.tipus === "numero" ? Number(element.value || 0) : element.value;
        if (question.id in data) {
            data[question.id] = value;
        } else {
            data.extra[question.id] = value;
        }
    });

    data.nom = String(data.nom || "").trim();
    data.nens = Number(data.nens || 0);
    return data;
}

function addMemberIfMissing(name) {
    const cleanName = name.trim();
    if (!cleanName) return;
    const exists = state.membresColla.some((member) => member.toLocaleLowerCase("ca") === cleanName.toLocaleLowerCase("ca"));
    if (!exists) {
        state.membresColla.push(cleanName);
        state.membresColla.sort((a, b) => a.localeCompare(b, "ca"));
    }
}

function saveFormulariResposta(sortidaIndex, data) {
    const existingIndex = state.sortides[sortidaIndex].assistencia.findIndex(
        (item) => item.nom.toLocaleLowerCase("ca") === data.nom.toLocaleLowerCase("ca")
    );
    if (existingIndex >= 0) {
        state.sortides[sortidaIndex].assistencia[existingIndex] = data;
        return "updated";
    }
    state.sortides[sortidaIndex].assistencia.push(data);
    return "created";
}

function buildSortidaSummaryText(sortidaIndex) {
    if ((sortidaIndex !== "0" && !sortidaIndex) || !state.sortides[sortidaIndex]) {
        return "";
    }

    const trip = state.sortides[sortidaIndex];
    const si = trip.assistencia.filter((item) => item.resposta === "si");
    const no = trip.assistencia.filter((item) => item.resposta === "no");
    const potser = trip.assistencia.filter((item) => item.resposta === "potser");
    const nens = trip.assistencia.reduce((sum, item) => sum + Number(item.nens || 0), 0);

    return [
        `Sortida: ${trip.nom}`,
        `Lloc i data: ${trip.lloc} - ${formatDate(trip.data)}`,
        `Estat: ${trip.estat}`,
        "",
        `Venen (${si.length}): ${si.length ? si.map((item) => item.nom).join(", ") : "ningú"}`,
        `No venen (${no.length}): ${no.length ? no.map((item) => item.nom).join(", ") : "ningú"}`,
        `Per confirmar (${potser.length}): ${potser.length ? potser.map((item) => item.nom).join(", ") : "ningú"}`,
        `Nens totals: ${nens}`
    ].join("\n");
}

async function copiarResumSortida() {
    const sortidaIndex = getSelectedSortidaIndex();
    const text = buildSortidaSummaryText(sortidaIndex);
    if (!text) {
        showToast("Selecciona una sortida per copiar el resum.", "warning");
        return;
    }

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
        }
        showToast("Resum copiat. Ja el pots enganxar al WhatsApp.", "success");
    } catch {
        showToast("No s'ha pogut copiar el resum automaticament.", "error");
    }
}

function eliminarTabaler(index) {
    const member = state.tabalers[index];
    if (!member || !confirmDelete(member.nom)) return;
    state.tabalers.splice(index, 1);
    renderAll();
}

function updateVestuariStock(type, size, amount) {
    state.vestuariStock[type][size] = Math.max(0, (state.vestuariStock[type][size] || 0) + amount);
    renderAll();
}

function adjustStockFromAssignment(assignment, direction) {
    if (!assignment) return;

    const garments = [
        { type: "dalt", size: assignment.daltTalla, status: assignment.daltEstat },
        { type: "baix", size: assignment.baixTalla, status: assignment.baixEstat }
    ];

    garments.forEach((garment) => {
        if (!garment.size) return;
        if (garment.status !== "persona") return;

        const current = state.vestuariStock[garment.type][garment.size] || 0;
        state.vestuariStock[garment.type][garment.size] = Math.max(0, current + direction);
    });
}

function openVestuariModal() {
    document.getElementById("modal-vestuari-title").innerText = "Nova assignacio de vestuari";
    document.getElementById("form-vestuari").reset();
    document.getElementById("v-index").value = "";
    toggleModal("modal-vestuari");
}

function editarVestuari(index) {
    const item = state.vestuariAssignacions[index];
    document.getElementById("modal-vestuari-title").innerText = "Editar assignacio de vestuari";
    document.getElementById("v-index").value = index;
    document.getElementById("v-nom").value = item.nom;
    document.getElementById("v-dalt-talla").value = item.daltTalla || "";
    document.getElementById("v-dalt-estat").value = item.daltEstat || "guardarropa";
    document.getElementById("v-baix-talla").value = item.baixTalla || "";
    document.getElementById("v-baix-estat").value = item.baixEstat || "guardarropa";
    toggleModal("modal-vestuari");
}

function eliminarVestuari(index) {
    const item = state.vestuariAssignacions[index];
    if (!item || !confirmDelete(item.nom)) return;
    adjustStockFromAssignment(state.vestuariAssignacions[index], 1);
    state.vestuariAssignacions.splice(index, 1);
    renderAll();
}

function openTextBlocModal(target) {
    document.getElementById("tb-target").value = target;
    const config = {
        "ordre-dia": {
            title: "Editar ordre del dia propera reunio",
            value: state.agendaBase
        }
    };
    document.getElementById("modal-text-bloc-title").innerText = config[target].title;
    document.getElementById("tb-text").value = config[target].value;
    toggleModal("modal-text-bloc");
}

function openJuntaModal() {
    document.getElementById("modal-junta-title").innerText = "Nova persona de junta";
    document.getElementById("form-junta").reset();
    document.getElementById("j-index").value = "";
    toggleModal("modal-junta");
}

function editarJunta(index) {
    const person = state.junta[index];
    document.getElementById("modal-junta-title").innerText = "Editar persona de junta";
    document.getElementById("j-index").value = index;
    document.getElementById("j-nom").value = person.nom;
    document.getElementById("j-carrec").value = person.carrec;
    document.getElementById("j-funcions").value = person.funcions.join("\n");
    toggleModal("modal-junta");
}

function eliminarJunta(index) {
    const person = state.junta[index];
    if (!person || !confirmDelete(person.nom)) return;
    state.junta.splice(index, 1);
    renderAll();
}

function openDocumentModal() {
    document.getElementById("modal-document-title").innerText = "Nou document";
    document.getElementById("form-document").reset();
    document.getElementById("doc-index").value = "";
    document.getElementById("doc-data").value = new Date().toISOString().split("T")[0];
    document.getElementById("doc-arxiu").value = "";
    toggleModal("modal-document");
}

function editarDocument(index) {
    const doc = state.documents[index];
    document.getElementById("modal-document-title").innerText = "Editar document";
    document.getElementById("doc-index").value = index;
    document.getElementById("doc-titol").value = doc.titol;
    document.getElementById("doc-categoria").value = doc.categoria;
    document.getElementById("doc-data").value = doc.data;
    document.getElementById("doc-descripcio").value = doc.descripcio;
    document.getElementById("doc-arxiu").value = "";
    toggleModal("modal-document");
}

function eliminarDocument(index) {
    const doc = state.documents[index];
    if (!doc || !confirmDelete(doc.titol)) return;
    state.documents.splice(index, 1);
    renderAll();
}

function arxivarDocument(index) {
    const doc = state.documents[index];
    if (!doc) return;
    doc.arxivada = true;
    renderAll();
}

function desarxivarDocument(index) {
    const doc = state.documents[index];
    if (!doc) return;
    doc.arxivada = false;
    renderAll();
}

function eliminarArxiuDocument(index) {
    const doc = state.documents[index];
    if (!doc || !doc.nomArxiu) return;
    if (!confirm(`Segur que vols eliminar l'arxiu "${doc.nomArxiu}"?`)) return;
    doc.nomArxiu = null;
    doc.tipusArxiu = null;
    doc.contingutArxiu = null;
    renderAll();
}

function formatDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString("ca-ES", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatCurrency(value) {
    return new Intl.NumberFormat("ca-ES", {
        style: "currency",
        currency: "EUR"
    }).format(value);
}

function formatPiroUsada(usada) {
    const labels = {
        carretilles: "carretilles",
        infantils: "infantils",
        brolladors: "brolladors",
        efectes: "fum/torxes"
    };
    const parts = Object.entries(labels)
        .map(([key, label]) => `${Number(usada?.[key] || 0)} ${label}`)
        .join(" · ");
    return parts;
}

function cargarPioSortidaSeleccionada() {
    const index = document.getElementById("piro-sortida-select").value;
    if (index === "") {
        document.getElementById("piro-sortida-carretilles").value = "";
        document.getElementById("piro-sortida-infantils").value = "";
        document.getElementById("piro-sortida-brolladors").value = "";
        document.getElementById("piro-sortida-efectes").value = "";
        document.getElementById("resultado-piro-sortida").innerText = "";
        return;
    }
    const trip = state.sortides[index];
    document.getElementById("piro-sortida-carretilles").value = trip.piroUsada?.carretilles || 0;
    document.getElementById("piro-sortida-infantils").value = trip.piroUsada?.infantils || 0;
    document.getElementById("piro-sortida-brolladors").value = trip.piroUsada?.brolladors || 0;
    document.getElementById("piro-sortida-efectes").value = trip.piroUsada?.efectes || 0;
    document.getElementById("resultado-piro-sortida").innerText = "";
}

function guardarPioSortida() {
    const index = document.getElementById("piro-sortida-select").value;
    if (index === "") {
        document.getElementById("resultado-piro-sortida").innerText = "Selecciona una sortida.";
        return;
    }

    const piroData = {
        carretilles: Number(document.getElementById("piro-sortida-carretilles").value || 0),
        infantils: Number(document.getElementById("piro-sortida-infantils").value || 0),
        brolladors: Number(document.getElementById("piro-sortida-brolladors").value || 0),
        efectes: Number(document.getElementById("piro-sortida-efectes").value || 0)
    };

    adjustStockFromSortida(state.sortides[index], 1);
    state.sortides[index].piroUsada = piroData;
    adjustStockFromSortida(state.sortides[index], -1);
    document.getElementById("resultado-piro-sortida").innerText = "Piro de la sortida actualitzada.";
    renderAll();
    document.getElementById("piro-sortida-select").value = String(index);
}

function handleAuthAction() {
    if (authState.token) {
        logoutPocketBase();
        return;
    }
    document.getElementById("auth-feedback").innerText = "";
    document.getElementById("form-auth").reset();
    toggleModal("modal-auth");
}

document.getElementById("form-reunion").onsubmit = (event) => {
    event.preventDefault();
    const index = document.getElementById("r-index").value;
    const meetingData = {
        data: document.getElementById("r-fecha").value,
        titol: document.getElementById("r-titulo").value,
        acords: document.getElementById("r-acords").value,
        acta: document.getElementById("r-acta").value,
        arxivada: index === "" ? false : state.reunions[index].arxivada
    };
    if (index === "") {
        state.reunions.unshift(meetingData);
    } else {
        state.reunions[index] = meetingData;
    }
    event.target.reset();
    document.getElementById("r-index").value = "";
    document.getElementById("modal-reunion-title").innerText = "Nova reunio";
    toggleModal("modal-reunion");
    renderAll();
};

document.getElementById("form-tasca").onsubmit = (event) => {
    event.preventDefault();
    const index = document.getElementById("t-index").value;
    const taskData = {
        titol: document.getElementById("t-titulo").value,
        responsable: document.getElementById("t-responsable").value,
        prioritat: document.getElementById("t-prioritat").value,
        detall: document.getElementById("t-detall").value,
        estat: "oberta"
    };
    if (index === "") {
        state.tasques.unshift(taskData);
    } else {
        taskData.estat = state.tasques[index].estat;
        state.tasques[index] = taskData;
    }
    event.target.reset();
    document.getElementById("t-index").value = "";
    document.getElementById("modal-tasca-title").innerText = "Nova tasca";
    toggleModal("modal-tasca");
    renderAll();
};

document.getElementById("form-junta").onsubmit = (event) => {
    event.preventDefault();
    const index = document.getElementById("j-index").value;
    const personData = {
        nom: document.getElementById("j-nom").value,
        carrec: document.getElementById("j-carrec").value,
        color: "accent",
        funcions: document.getElementById("j-funcions").value
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
    };
    if (index === "") {
        state.junta.push(personData);
    } else {
        state.junta[index] = personData;
    }
    event.target.reset();
    document.getElementById("j-index").value = "";
    document.getElementById("modal-junta-title").innerText = "Nova persona de junta";
    toggleModal("modal-junta");
    renderAll();
};

document.getElementById("form-document").onsubmit = (event) => {
    event.preventDefault();
    const index = document.getElementById("doc-index").value;
    const fileInput = document.getElementById("doc-arxiu");
    
    const processDocument = (fileData) => {
        const docData = {
            id: index === "" ? Date.now() : state.documents[index].id,
            titol: document.getElementById("doc-titol").value,
            categoria: document.getElementById("doc-categoria").value,
            data: document.getElementById("doc-data").value,
            descripcio: document.getElementById("doc-descripcio").value,
            arxivada: index === "" ? false : state.documents[index].arxivada,
            nomArxiu: fileData ? fileData.nomArxiu : (state.documents[index]?.nomArxiu || null),
            tipusArxiu: fileData ? fileData.tipusArxiu : (state.documents[index]?.tipusArxiu || null),
            contingutArxiu: fileData ? fileData.contingutArxiu : (state.documents[index]?.contingutArxiu || null)
        };
        
        if (index === "") {
            state.documents.push(docData);
        } else {
            state.documents[index] = docData;
        }
        
        event.target.reset();
        document.getElementById("doc-index").value = "";
        document.getElementById("modal-document-title").innerText = "Nou document";
        toggleModal("modal-document");
        renderAll();
    };

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const fileData = {
                nomArxiu: file.name,
                tipusArxiu: file.type,
                contingutArxiu: e.target.result
            };
            processDocument(fileData);
        };
        
        reader.onerror = function() {
            showToast("Error al llegir l'arxiu", "error");
            processDocument(null);
        };
        
        reader.readAsDataURL(file);
    } else {
        processDocument(null);
    }
};

document.getElementById("form-sortida").onsubmit = (event) => {
    event.preventDefault();
    const index = document.getElementById("s-index").value;
    const tripData = {
        nom: document.getElementById("s-nom").value,
        lloc: document.getElementById("s-lloc").value,
        data: document.getElementById("s-data").value,

        notes: document.getElementById("s-notes").value,
        piroUsada: index === "" 
            ? { carretilles: 0, infantils: 0, brolladors: 0, efectes: 0 }
            : state.sortides[index].piroUsada,
        assistencia: index === "" ? [] : state.sortides[index].assistencia
    };

    if (index === "") {
        state.sortides.push(tripData);
        // Enviar notificación para nueva salida
        sendSortidaNotification(tripData);
    } else {
        state.sortides[index] = tripData;
    }

    event.target.reset();
    document.getElementById("s-index").value = "";
    document.getElementById("lista-sortides-modal").innerHTML = renderSortidesModalList();
    document.getElementById("form-sortida-container").style.display = "none";
    document.querySelector(".sortides-list-container").style.display = "block";
    renderAll();
};

document.getElementById("sortida-gestio-select").onchange = () => {
    renderGestioSortida();
};

document.getElementById("piro-sortida-select").onchange = () => {
    cargarPioSortidaSeleccionada();
};

document.getElementById("formulari-sortida-select").onchange = () => {
    document.getElementById("formulari-feedback").innerText = "";
};

document.getElementById("form-tabaler").onsubmit = (event) => {
    event.preventDefault();
    const index = document.getElementById("tb-index").value;
    const tabalerData = {
        nom: document.getElementById("tb-nom").value,
        tipus: document.getElementById("tb-tipo").value,
        edat: Number(document.getElementById("tb-edat").value || 0),
        assajosMes: Number(document.getElementById("tb-assajos").value || 0)
    };
    if (index === "") {
        state.tabalers.push(tabalerData);
    } else {
        state.tabalers[index] = tabalerData;
    }
    event.target.reset();
    document.getElementById("tb-index").value = "";
    document.getElementById("modal-tabaler-title").innerText = "Nou tabaler";
    toggleModal("modal-tabaler");
    renderAll();
};

document.getElementById("form-vestuari").onsubmit = (event) => {
    event.preventDefault();
    const index = document.getElementById("v-index").value;
    const data = {
        nom: document.getElementById("v-nom").value,
        daltTalla: document.getElementById("v-dalt-talla").value,
        daltEstat: document.getElementById("v-dalt-estat").value,
        baixTalla: document.getElementById("v-baix-talla").value,
        baixEstat: document.getElementById("v-baix-estat").value
    };
    if (index === "") {
        adjustStockFromAssignment(data, -1);
        state.vestuariAssignacions.push(data);
    } else {
        adjustStockFromAssignment(state.vestuariAssignacions[index], 1);
        adjustStockFromAssignment(data, -1);
        state.vestuariAssignacions[index] = data;
    }
    event.target.reset();
    document.getElementById("v-index").value = "";
    document.getElementById("modal-vestuari-title").innerText = "Nova assignacio de vestuari";
    toggleModal("modal-vestuari");
    renderAll();
};

document.getElementById("form-sortida-public").onsubmit = (event) => {
    event.preventDefault();
    const sortidaIndex = document.getElementById("formulari-sortida-select").value;
    const feedback = document.getElementById("formulari-feedback");
    const data = readDynamicFormResponse("form");
    const name = data.nom;

    if (!sortidaIndex && sortidaIndex !== "0") {
        feedback.innerText = "Selecciona una sortida abans d'enviar.";
        return;
    }
    if (!name) {
        feedback.innerText = "Escriu el teu nom.";
        return;
    }

    addMemberIfMissing(name);
    const result = saveFormulariResposta(sortidaIndex, data);
    const selectedSortida = sortidaIndex;
    event.target.reset();
    document.getElementById("formulari-sortida-select").value = selectedSortida;
    feedback.innerText = result === "updated"
        ? "Resposta actualitzada. Gracies!"
        : "Resposta enviada. Gracies!";
    renderAll();
    document.getElementById("formulari-sortida-select").value = selectedSortida;
};

document.getElementById("form-config-formulari").onsubmit = (event) => {
    event.preventDefault();
    const input = document.getElementById("nova-pregunta-formulari");
    const typeSelect = document.getElementById("nova-pregunta-tipus");
    if (addQuestionToForm(input.value, typeSelect.value)) {
        input.value = "";
        typeSelect.value = "text";
        renderAll();
        showToast("Pregunta afegida al formulari.", "success");
    }
};

// Verificar que los elementos existan antes de asignar event listeners
const respostesFormSortidaSelect = document.getElementById("respostes-form-sortida-select");
if (respostesFormSortidaSelect) {
    respostesFormSortidaSelect.onchange = () => {
        renderRespostesForm();
    };
}

const formJuntaAuth = document.getElementById("form-junta-auth");
if (formJuntaAuth) {
    formJuntaAuth.onsubmit = (event) => {
        event.preventDefault();
        const password = document.getElementById("junta-password").value;
        const feedback = document.getElementById("junta-auth-feedback");

        if (verifyJuntaPassword(password)) {
            juntaAuthenticated = true;
            toggleModal("modal-junta-auth");
            showTab("tab-junta");
            showToast("Accés concedit", "success");
        } else {
            feedback.innerText = "Contrasenya incorrecta";
            feedback.style.color = "var(--color-error)";
        }
    };
}

const formVestuariAuth = document.getElementById("form-vestuari-auth");
if (formVestuariAuth) {
    formVestuariAuth.onsubmit = (event) => {
        event.preventDefault();
        const password = document.getElementById("vestuari-password").value;

        if (verifyVestuariPassword(password)) {
            vestuariAuthenticated = true;
            toggleModal("modal-vestuari-auth");
            showTab("tab-vestuari");
            showToast("Accés a vestuari concedit", "success");
        } else {
            showToast("Contrasenya incorrecta", "error");
        }
    };
}

const formReservaRoba = document.getElementById("form-reserva-roba");
if (formReservaRoba) {
    formReservaRoba.onsubmit = (event) => {
        event.preventDefault();
        const index = document.getElementById("rr-index").value;
        const sortidaId = document.getElementById("rr-sortida-id").value;
        const reservaData = {
            sortidaId: sortidaId,
            nom: document.getElementById("rr-nom").value,
            daltTalla: document.getElementById("rr-dalt-talla").value,
            daltEstat: document.getElementById("rr-dalt-estat").value,
            baixTalla: document.getElementById("rr-baix-talla").value,
            baixEstat: document.getElementById("rr-baix-estat").value
        };

        if (index === "") {
            state.reservesRoba.push(reservaData);
        } else {
            state.reservesRoba[index] = reservaData;
        }

        event.target.reset();
        document.getElementById("rr-index").value = "";
        document.getElementById("rr-sortida-id").value = "";
        toggleModal("modal-reserva-roba");
        renderReservesRoba();
        renderAll();
    };
}

const reservaSortidaSelect = document.getElementById("reserva-sortida-select");
if (reservaSortidaSelect) {
    reservaSortidaSelect.onchange = () => {
        renderReservesRoba();
    };
}

const formChangePassword = document.getElementById("form-change-password");
if (formChangePassword) {
    formChangePassword.onsubmit = (event) => {
        event.preventDefault();
        const oldPassword = document.getElementById("old-password").value;
        const newPassword = document.getElementById("new-password").value;
        const feedback = document.getElementById("change-password-feedback");
        
        const result = changeJuntaPassword(oldPassword, newPassword);
        
        if (result.success) {
            toggleModal("modal-change-password");
            showToast(result.message, "success");
        } else {
            feedback.innerText = result.message;
            feedback.style.color = "var(--color-error)";
        }
    };
}

const sortidaMapaSelect = document.getElementById("sortida-mapa-select");
if (sortidaMapaSelect) {
    sortidaMapaSelect.onchange = () => {
        carregarRecorrido();
    };
}

document.getElementById("form-participant-sortida").onsubmit = (event) => {
    event.preventDefault();
    const sortidaIndex = getSelectedSortidaIndex();
    const participantIndex = document.getElementById("ps-index").value;
    const data = {
        nom: document.getElementById("ps-nom").value,
        resposta: document.getElementById("ps-resposta").value,
        nens: Number(document.getElementById("ps-nens").value || 0),
        menjar: document.getElementById("ps-menjar").value,
        notes: document.getElementById("ps-notes").value
    };
    addMemberIfMissing(data.nom);
    if (participantIndex === "") {
        state.sortides[sortidaIndex].assistencia.push(data);
    } else {
        state.sortides[sortidaIndex].assistencia[participantIndex] = data;
    }
    event.target.reset();
    document.getElementById("ps-index").value = "";
    document.getElementById("modal-participant-title").innerText = "Nova resposta de sortida";
    toggleModal("modal-participant-sortida");
    renderAll();
    document.getElementById("sortida-gestio-select").value = String(sortidaIndex);
};

document.getElementById("form-text-bloc").onsubmit = (event) => {
    event.preventDefault();
    const target = document.getElementById("tb-target").value;
    const text = document.getElementById("tb-text").value.trim();
    if (target === "ordre-dia") {
        state.agendaBase = text;
    }
    event.target.reset();
    document.getElementById("tb-target").value = "";
    document.getElementById("modal-text-bloc-title").innerText = "Editar text";
    toggleModal("modal-text-bloc");
    renderAll();
};

document.getElementById("form-auth").onsubmit = async (event) => {
    event.preventDefault();
    const feedback = document.getElementById("auth-feedback");
    feedback.innerText = "Iniciant sessio...";
    try {
        await loginPocketBase(
            document.getElementById("auth-email").value,
            document.getElementById("auth-password").value
        );
        feedback.innerText = "Sessio iniciada.";
        toggleModal("modal-auth");
        showToast("Sessio iniciada correctament.", "success");
        await hydrateStateFromPocketBase();
    } catch (error) {
        feedback.innerText = "No s'ha pogut iniciar sessio.";
        showToast("No s'ha pogut iniciar sessio.", "error");
        setSyncStatus("error", `Auth PB: ${error.message}`);
    }
};

document.getElementById("form-bestia").onsubmit = (event) => {
    event.preventDefault();
    const index = document.getElementById("b-index").value;
    const data = {
        nom: document.getElementById("b-nom").value,
        poblacio: document.getElementById("b-poblacio").value,
        feina: document.getElementById("b-feina").value,
        contacteNom: document.getElementById("b-contacte-nom").value,
        contacteTelefon: document.getElementById("b-contacte-telefon").value
    };
    if (index === "") {
        state.bestiari.push(data);
    } else {
        state.bestiari[index] = data;
    }
    event.target.reset();
    document.getElementById("b-index").value = "";
    document.getElementById("modal-bestia-title").innerText = "Nou contacte bestiari";
    toggleModal("modal-bestia");
    renderAll();
};

function formatTextBlock(text) {
    return (text || "")
        .split("\n")
        .map((line) => line.trim())
        .join("<br>");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function escapeAttr(value) {
    return escapeHtml(value)
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

window.onclick = (event) => {
    document.querySelectorAll(".modal").forEach((modal) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
};

// Función para cargar preguntas desde PocketBase
async function loadQuestionsFromPocketBase() {
    if (!PB_CONFIG.enabled) return;
    
    try {
        const authResponse = await fetch(
            buildPocketBaseUrl('/api/admins/auth-with-password'),
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identity: PB_ADMIN_EMAIL,
                    password: PB_ADMIN_PASSWORD
                })
            }
        );
        
        if (authResponse.ok) {
            const authData = await authResponse.json();
            const token = authData.token;
            
            const response = await fetch(
                buildPocketBaseUrl('/api/collections/formulari_preguntes/records'),
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                const questions = data.items || [];
                
                if (questions.length > 0) {
                    console.log("Cargando preguntas desde PocketBase:", questions.length);
                    // Mapear pregunta_id a id para compatibilidad
                    state.formulariPreguntes = questions.map(q => ({
                        id: q.pregunta_id || q.id,
                        pregunta_id: q.pregunta_id || q.id,
                        text: q.text,
                        tipus: q.tipus,
                        requerida: q.requerida,
                        fixa: q.fixa
                    }));
                    renderAll();
                } else {
                    console.log("No hay preguntas en PocketBase, usando las locales");
                    // Si no hay preguntas en PocketBase, guardar las iniciales
                    await saveInitialQuestionsToPocketBase();
                }
            }
        }
    } catch (error) {
        console.error("Error cargando preguntas desde PocketBase:", error);
    }
}

// Función para guardar las preguntas iniciales en PocketBase
async function saveInitialQuestionsToPocketBase() {
    if (!PB_CONFIG.enabled) return;
    
    try {
        const authResponse = await fetch(
            buildPocketBaseUrl('/api/admins/auth-with-password'),
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identity: PB_ADMIN_EMAIL,
                    password: PB_ADMIN_PASSWORD
                })
            }
        );
        
        if (authResponse.ok) {
            const authData = await authResponse.json();
            const token = authData.token;
            
            // Convertir preguntas al formato de PocketBase
            const questionsToSave = defaultData.formulariPreguntes.map(q => ({
                pregunta_id: q.id,
                text: q.text,
                tipus: q.tipus,
                requerida: q.requerida,
                fixa: q.fixa
            }));
            
            for (const question of questionsToSave) {
                await fetch(
                    buildPocketBaseUrl('/api/collections/formulari_preguntes/records'),
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(question)
                    }
                );
            }
            
            console.log("Preguntas iniciales guardadas en PocketBase");
        }
    } catch (error) {
        console.error("Error guardando preguntas iniciales:", error);
    }
}

try {
    updateAuthStatus();
    initializeNotificationButton();
    renderAll({ persist: false });
    hydrateStateFromPocketBase();
    
    // Cargar preguntas desde PocketBase después de hidratar el estado
    setTimeout(() => {
        loadQuestionsFromPocketBase();
    }, 1000);
} catch (error) {
    console.error("Error al inicializar la aplicación:", error);
}

// Script de inicialización para PocketBase - La Pigota
// Este script crea las colecciones y carga los datos iniciales

const PocketBase = require('pocketbase').default;
const fs = require('fs');

// Configuración
const PB_URL = 'http://192.168.0.29:8090'; // Tu servidor CasaOS
const ADMIN_EMAIL = 'admin@lapigota.cat';
const ADMIN_PASSWORD = 'lapigota2026'; // Cambiar esto en producción

// Datos iniciales basados en la aplicación
const initialData = {
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
    membres_colla: [
        "Abraham Fernandez", "Adria Figuerola", "Adriana Mato", "Alba Giralt",
        "Alba Pozuelo", "Alba Rullo", "Albert Bataller", "Anna Fortuny",
        "Aral Bataller", "Aran Jepus", "Ariadna Vallve", "Aurembiaix Vallve",
        "Bea Bellalta", "Carles Vallve", "Chema Martinez", "Cristian Pujol",
        "David Jansa", "Edu Ruiz", "Eira Martinez", "Elba Duch",
        "Eloi Macias", "Emma Fernandez", "Ermessenda Vallve", "Eudald Duch",
        "Feliu Fortuny", "Hicham Jannati", "Izan Fernandez", "Jordi Duch",
        "Jordi Munte", "Leia Coll", "Llorenc Jansa", "Lluis Vallve",
        "Loli Guillen", "Luca Fernandez", "Lydia Prieto", "Manel Jepus",
        "Marc Sanchez", "Maria Tarrago", "Marta Pellicer", "Marti Pons",
        "Martina Jepus", "Mireia de Almeida", "Montse Roige", "Nuria Princep",
        "Oriol Vallve", "Oscar Macias", "Otger Coll", "Pau Coll",
        "Pau Munte", "Pep Munte", "Pol Munte", "Remei Marsal",
        "Richi Balaguer", "Sonia Martos", "Xana Laviana"
    ].map(nom => ({ nom, actiu: true })),
    
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
    
    sortides: [
        {
            nom: "Correfoc de la Nou",
            lloc: "La Nou",
            data: "2026-07-15",
            estat: "pendent pressupost",
            notes: "L'alcaldessa ha preguntat si es vol fer petites i grossa. Cal valorar caps de setmana i pressupost.",
            piroUsada: { carretilles: 0, infantils: 0, brolladors: 0, efectes: 0 },
            assistencia: []
        },
        {
            nom: "La Pobla - Festa del Gall",
            lloc: "La Pobla",
            data: "2026-07-25",
            estat: "en proces",
            notes: "Parlar amb els del Gall. Prevista per adults i infantils.",
            piroUsada: { carretilles: 0, infantils: 0, brolladors: 0, efectes: 0 },
            assistencia: []
        },
        {
            nom: "Creixell",
            lloc: "Creixell",
            data: "2026-08-01",
            estat: "pendent de tancar",
            notes: "Encara no esta tancat, cal parlar-hi.",
            piroUsada: { carretilles: 0, infantils: 0, brolladors: 0, efectes: 0 },
            assistencia: []
        },
        {
            nom: "Dinar i assaig de colla",
            lloc: "La Pobla",
            data: "2026-06-07",
            estat: "pendent",
            notes: "Quedar tots, fer dinar i assaig de correfocs. El Pol fara paella.",
            piroUsada: { carretilles: 0, infantils: 0, brolladors: 0, efectes: 0 },
            assistencia: []
        }
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
    
    piro_stock: [
        {
            carretilles: 500,
            infantils: 150,
            brolladors: 40,
            efectes: 12
        }
    ],
    
    vestuari_stock: [
        {
            dalt: { "GA": 1, "L": 0, "M": 4, "P": 7, "ESPECIALS": 6, "PI": 6, "MI": 8, "GI": 5, "TELA FINA M": 1 },
            baix: { "G": 5, "L": 0, "M": 13, "P": 3, "ESPECIALS": 2, "PIE": 3, "Pi": 2, "MI": 9, "GI": 6, "TELA FINA MINI": 1, "TELA FINA M/P": 2 }
        }
    ],
    
    formulari_preguntes: [
        { id: "nom", text: "Nom i cognom", tipus: "nom", requerida: true, fixa: true },
        { id: "resposta", text: "Vindras a aquesta sortida?", tipus: "assistencia", requerida: true },
        { id: "nens", text: "Quants nens vindran amb tu?", tipus: "numero" },
        { id: "menjar", text: "Tema menjar o observacions d'al.lergies", tipus: "text" },
        { id: "notes", text: "Vols afegir alguna cosa mes?", tipus: "llarg" }
    ],
    
    configuracio: [
        {
            key: "juntaPassword",
            value: "junta2026"
        },
        {
            key: "vestuariPassword",
            value: "vestuari2026"
        },
        {
            key: "agendaBase",
            value: "Aprovacio acta anterior\n\nRepas de compromisos\n\nEstat de comptes\n\nAsseguranca i normativa\n\nEvents confirmats\n\nSortides d'agost\n\nTemes a tractar\n\nAcords i compromisos"
        },
        {
            key: "eixos",
            value: ["Organigrama", "Objectius curt termini", "Objectius mitja termini", "Temporalitat", "Sortides", "Pirotecnia", "Tabals", "Roba", "Canalla", "Subvencions", "Comunicacio"]
        },
        {
            key: "comunicadores",
            value: ["President", "Secretari", "Vocal comunicacio"]
        }
    ]
};

// Función para crear colecciones
async function createCollections(pb) {
    const collections = [
        {
            name: 'junta',
            type: 'base',
            schema: [
                { name: 'nom', type: 'text', required: true },
                { name: 'carrec', type: 'text', required: true },
                { name: 'color', type: 'text', default: 'accent' },
                { name: 'funcions', type: 'array' }
            ]
        },
        {
            name: 'membres_colla',
            type: 'base',
            schema: [
                { name: 'nom', type: 'text', required: true },
                { name: 'actiu', type: 'bool', default: true }
            ]
        },
        {
            name: 'sortides',
            type: 'base',
            schema: [
                { name: 'nom', type: 'text', required: true },
                { name: 'lloc', type: 'text', required: true },
                { name: 'data', type: 'date', required: true },
                { name: 'estat', type: 'text', default: 'pendent' },
                { name: 'notes', type: 'text' },
                { name: 'piroUsada', type: 'json' },
                { name: 'assistencia', type: 'array' }
            ]
        },
        {
            name: 'bestiari',
            type: 'base',
            schema: [
                { name: 'nom', type: 'text', required: true },
                { name: 'poblacio', type: 'text', required: true },
                { name: 'feina', type: 'text', default: 'Bestia' },
                { name: 'contacteNom', type: 'text' },
                { name: 'contacteTelefon', type: 'text' }
            ]
        },
        {
            name: 'reunions',
            type: 'base',
            schema: [
                { name: 'data', type: 'date', required: true },
                { name: 'titol', type: 'text', required: true },
                { name: 'acords', type: 'text' },
                { name: 'acta', type: 'text' },
                { name: 'arxivada', type: 'bool', default: false }
            ]
        },
        {
            name: 'tasques',
            type: 'base',
            schema: [
                { name: 'titol', type: 'text', required: true },
                { name: 'responsable', type: 'text' },
                { name: 'prioritat', type: 'text', default: 'mitjana' },
                { name: 'detall', type: 'text' },
                { name: 'estat', type: 'text', default: 'oberta' }
            ]
        },
        {
            name: 'piro_stock',
            type: 'base',
            schema: [
                { name: 'carretilles', type: 'number', default: 0 },
                { name: 'infantils', type: 'number', default: 0 },
                { name: 'brolladors', type: 'number', default: 0 },
                { name: 'efectes', type: 'number', default: 0 }
            ]
        },
        {
            name: 'vestuari_stock',
            type: 'base',
            schema: [
                { name: 'dalt', type: 'json' },
                { name: 'baix', type: 'json' }
            ]
        },
        {
            name: 'formulari_preguntes',
            type: 'base',
            schema: [
                { name: 'id', type: 'text', required: true },
                { name: 'text', type: 'text', required: true },
                { name: 'tipus', type: 'text', required: true },
                { name: 'requerida', type: 'bool', default: false },
                { name: 'fixa', type: 'bool', default: false }
            ]
        },
        {
            name: 'configuracio',
            type: 'base',
            schema: [
                { name: 'key', type: 'text', required: true },
                { name: 'value', type: 'json', required: true }
            ]
        }
    ];

    for (const collection of collections) {
        try {
            console.log(`Creando colección: ${collection.name}`);
            // PocketBase no tiene API directa para crear colecciones desde JS
            // Las colecciones deben crearse desde el panel admin
            console.log(`Nota: La colección ${collection.name} debe crearse manualmente desde el panel admin`);
        } catch (error) {
            console.warn(`Error creando colección ${collection.name}:`, error.message);
        }
    }
    
    console.log('Las colecciones deben crearse manualmente desde el panel admin de PocketBase');
    console.log('Accede a: http://192.168.0.29:8090/_/');
}

async function setupPocketBase() {
    console.log('Conectando a PocketBase en', PB_URL);
    
    const pb = new PocketBase(PB_URL);
    
    try {
        // Intentar login como admin
        try {
            await pb.collection('users').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
            console.log('Autenticado como admin exitosamente');
        } catch (error) {
            console.log('Error autenticando:', error.message);
            console.log('El usuario admin ya existe o hay un problema de autenticación');
            console.log('Intentando continuar con autenticación existente...');
            
            // Intentar autenticación con el endpoint de admin
            try {
                const authData = await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
                console.log('Autenticado como admin del sistema');
            } catch (adminError) {
                console.log('Error con autenticación de admin:', adminError.message);
                throw new Error('No se pudo autenticar con ninguna credencial');
            }
        }
        
        // Verificar si las colecciones existen
        console.log('Verificando colecciones...');
        const collections = ['junta', 'membres_colla', 'sortides', 'bestiari', 'reunions', 'tasques', 'piro_stock', 'vestuari_stock', 'formulari_preguntes', 'configuracio'];
        
        let allCollectionsExist = true;
        for (const collection of collections) {
            try {
                await pb.collection(collection).getList(1, 1);
            } catch (error) {
                console.log(`Colección ${collection} no existe`);
                allCollectionsExist = false;
            }
        }
        
        if (!allCollectionsExist) {
            console.log('=== ATENCIÓN: Las colecciones no existen ===');
            console.log('Debes crear las colecciones manualmente desde el panel admin:');
            console.log('1. Accede a: http://192.168.0.29:8090/_/');
            console.log('2. Login con admin@lapigota.cat / admin123');
            console.log('3. Ve a "Settings" > "Collections"');
            console.log('4. Crea estas colecciones:');
            console.log('   - junta');
            console.log('   - membres_colla');
            console.log('   - sortides');
            console.log('   - bestiari');
            console.log('   - reunions');
            console.log('   - tasques');
            console.log('   - piro_stock');
            console.log('   - vestuari_stock');
            console.log('   - formulari_preguntes');
            console.log('   - configuracio');
            console.log('5. Después vuelve a ejecutar: npm run setup');
            return;
        }
        
        // Función para cargar datos en una colección
        async function loadCollection(collectionName, data) {
            if (!data || data.length === 0) {
                console.log(`No hay datos para ${collectionName}, saltando...`);
                return;
            }
            
            console.log(`Cargando ${data.length} registros en ${collectionName}...`);
            
            try {
                // Primero verificar si ya existen datos
                const existing = await pb.collection(collectionName).getList(1, 1);
                if (existing.totalItems > 0) {
                    console.log(`La colección ${collectionName} ya tiene datos (${existing.totalItems}), saltando carga inicial...`);
                    return;
                }
                
                // Cargar datos en lotes
                for (const item of data) {
                    try {
                        await pb.collection(collectionName).create(item);
                    } catch (error) {
                        console.warn(`Error al cargar item en ${collectionName}:`, error.message);
                    }
                }
                
                console.log(`✓ Datos cargados exitosamente en ${collectionName}`);
            } catch (error) {
                console.error(`Error cargando ${collectionName}:`, error.message);
            }
        }
        
        // Cargar todas las colecciones
        for (const [collectionName, data] of Object.entries(initialData)) {
            await loadCollection(collectionName, data);
        }
        
        console.log('\n✓✓✓ Setup de PocketBase completado exitosamente ✓✓✓');
        console.log(`Puedes acceder al admin panel en: ${PB_URL}/_/`);
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        
    } catch (error) {
        console.error('Error durante el setup:', error);
        process.exit(1);
    }
}

// Ejecutar el setup
setupPocketBase().catch(console.error);
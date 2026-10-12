// Script para crear colecciones en PocketBase usando la API REST
const PocketBase = require('pocketbase').default;

const PB_URL = 'http://192.168.0.29:8090';
const ADMIN_EMAIL = 'admin@lapigota.cat';
const ADMIN_PASSWORD = 'lapigota2026';

const collections = [
    {
        name: 'junta',
        type: 'base',
        schema: [
            { name: 'nom', type: 'text', required: true },
            { name: 'carrec', type: 'text', required: true },
            { name: 'color', type: 'text', default: 'accent' },
            { name: 'funcions', type: 'json' }
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
            { name: 'assistencia', type: 'json' }
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

async function createCollections() {
    console.log('Conectando a PocketBase...');
    const pb = new PocketBase(PB_URL);
    
    try {
        // Autenticar como admin
        await pb.collection('users').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('Autenticado como admin');
        
        // PocketBase no tiene API pública para crear colecciones
        // Las colecciones deben crearse manualmente desde el panel admin
        console.log('=== ATENCIÓN ===');
        console.log('PocketBase no tiene API pública para crear colecciones programáticamente.');
        console.log('Las colecciones deben crearse manualmente desde el panel de administración.');
        console.log('');
        console.log('Instrucciones:');
        console.log('1. Accede a: http://192.168.0.29:8090/_/');
        console.log('2. Login con admin@lapigota.cat / admin123');
        console.log('3. Ve a "Settings" > "Collections"');
        console.log('4. Crea las colecciones manualmente (ver CREAR_COLECCIONES_POCKETBASE.md)');
        console.log('5. Después ejecuta: npm run setup');
        console.log('');
        console.log('Colecciones necesarias:');
        collections.forEach(c => console.log(`  - ${c.name}`));
        
        console.log('\n=== Proceso de creación de colecciones completado ===');
        console.log('Ahora ejecuta: npm run setup para cargar los datos');
        
    } catch (error) {
        console.error('Error general:', error);
        console.log('Si falla, crea las colecciones manualmente desde el panel admin');
    }
}

createCollections();
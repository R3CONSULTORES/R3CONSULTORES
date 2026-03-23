import type { Client, Task } from '../types';

const monthShortNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Calendarios Tributarios
// --- AÑO 2024 ---
const rentaPjDeadlines2024 = { '1': 10, '2': 11, '3': 12, '4': 15, '5': 16, '6': 17, '7': 18, '8': 19, '9': 22, '0': 23 };
const rentaPnDeadlines2024 = { '01': {m:7, d:12},'02': {m:7, d:12},'03': {m:7, d:13},'04': {m:7, d:13},'05': {m:7, d:14},'06': {m:7, d:14},'07': {m:7, d:15},'08': {m:7, d:15},'09': {m:7, d:19},'10': {m:7, d:19},'11': {m:7, d:20},'12': {m:7, d:20},'13': {m:7, d:21},'14': {m:7, d:21},'15': {m:7, d:22},'16': {m:7, d:22},'17': {m:7, d:25},'18': {m:7, d:25},'19': {m:7, d:26},'20': {m:7, d:26},'21': {m:7, d:27},'22': {m:7, d:27},'23': {m:7, d:28},'24': {m:7, d:28},'25': {m:7, d:29},'26': {m:7, d:29},'27': {m:8, d:1},'28': {m:8, d:1},'29': {m:8, d:2},'30': {m:8, d:2},'31': {m:8, d:3},'32': {m:8, d:3},'33': {m:8, d:4},'34': {m:8, d:4},'35': {m:8, d:5},'36': {m:8, d:5},'37': {m:8, d:8},'38': {m:8, d:8},'39': {m:8, d:9},'40': {m:8, d:9},'41': {m:8, d:10},'42': {m:8, d:10},'43': {m:8, d:11},'44': {m:8, d:11},'45': {m:8, d:12},'46': {m:8, d:12},'47': {m:8, d:15},'48': {m:8, d:15},'49': {m:8, d:16},'50': {m:8, d:16},'51': {m:8, d:17},'52': {m:8, d:17},'53': {m:8, d:18},'54': {m:8, d:18},'55': {m:8, d:19},'56': {m:8, d:19},'57': {m:8, d:22},'58': {m:8, d:22},'59': {m:8, d:23},'60': {m:8, d:23},'61': {m:8, d:24},'62': {m:8, d:24},'63': {m:8, d:25},'64': {m:8, d:25},'65': {m:8, d:26},'66': {m:8, d:26},'67': {m:9, d:1},'68': {m:9, d:1},'69': {m:9, d:2},'70': {m:9, d:2},'71': {m:9, d:3},'72': {m:9, d:3},'73': {m:9, d:6},'74': {m:9, d:6},'75': {m:9, d:7},'76': {m:9, d:7},'77': {m:9, d:8},'78': {m:9, d:8},'79': {m:9, d:9},'80': {m:9, d:9},'81': {m:9, d:10},'82': {m:9, d:10},'83': {m:9, d:14},'84': {m:9, d:14},'85': {m:9, d:15},'86': {m:9, d:15},'87': {m:9, d:16},'88': {m:9, d:16},'89': {m:9, d:17},'90': {m:9, d:17},'91': {m:9, d:20},'92': {m:9, d:20},'93': {m:9, d:21},'94': {m:9, d:21},'95': {m:9, d:22},'96': {m:9, d:22},'97': {m:9, d:23},'98': {m:9, d:23},'99': {m:9, d:24},'00': {m:9, d:24}};
const reteFuenteDeadlinesByPaymentMonth2024: Record<number, Record<string, number>> = { 1: {'1': 9,'2': 10,'3': 11,'4': 12,'5': 15,'6': 16,'7': 17,'8': 18,'9': 19,'0': 22}, 2: {'1': 8,'2': 9,'3': 12,'4': 13,'5': 14,'6': 15,'7': 16,'8': 19,'9': 20,'0': 21}, 3: {'1': 5,'2': 6,'3': 7,'4': 8,'5': 11,'6': 12,'7': 13,'8': 14,'9': 15,'0': 18}, 4: {'1': 10,'2': 11,'3': 12,'4': 15,'5': 16,'6': 17,'7': 18,'8': 19,'9': 22,'0': 23}, 5: {'1': 10,'2': 13,'3': 14,'4': 15,'5': 16,'6': 17,'7': 20,'8': 21,'9': 22,'0': 23}, 6: {'1': 7,'2': 10,'3': 11,'4': 12,'5': 13,'6': 14,'7': 18,'8': 19,'9': 20,'0': 21}, 7: {'1': 9,'2': 10,'3': 11,'4': 12,'5': 15,'6': 16,'7': 17,'8': 18,'9': 22,'0': 23}, 8: {'1': 9,'2': 12,'3': 13,'4': 14,'5': 15,'6': 16,'7': 20,'8': 21,'9': 22,'0': 23}, 9: {'1': 6,'2': 9,'3': 10,'4': 11,'5': 12,'6': 13,'7': 16,'8': 17,'9': 18,'0': 19}, 10: {'1': 8,'2': 9,'3': 10,'4': 11,'5': 15,'6': 16,'7': 17,'8': 18,'9': 21,'0': 22}, 11: {'1': 8,'2': 11,'3': 12,'4': 13,'5': 14,'6': 15,'7': 19,'8': 20,'9': 21,'0': 22}, 12: {'1': 10,'2': 13,'3': 14,'4': 15,'5': 16,'6': 17,'7': 20,'8': 21,'9': 22,'0': 23} };
const ivaBimestralDeadlines2024: Record<number, { schedule: Record<string, number>, bimester: number }> = { 2: {schedule: {'1': 8,'2': 9,'3': 12,'4': 13,'5': 14,'6': 15,'7': 16,'8': 19,'9': 20,'0': 21}, bimester: 1}, 4: {schedule: {'1': 10,'2': 13,'3': 14,'4': 15,'5': 16,'6': 17,'7': 20,'8': 21,'9': 22,'0': 23}, bimester: 2}, 6: {schedule: {'1': 9,'2': 10,'3': 11,'4': 12,'5': 15,'6': 16,'7': 17,'8': 18,'9': 22,'0': 23}, bimester: 3}, 8: {schedule: {'1': 9,'2': 12,'3': 13,'4': 14,'5': 15,'6': 16,'7': 20,'8': 21,'9': 22,'0': 23}, bimester: 4}, 10: {schedule: {'1': 8,'2': 9,'3': 10,'4': 11,'5': 15,'6': 16,'7': 17,'8': 18,'9': 21,'0': 22}, bimester: 5}, 12: {schedule: {'1': 10,'2': 13,'3': 14,'4': 15,'5': 16,'6': 17,'7': 20,'8': 21,'9': 22,'0': 23}, bimester: 6} };
const ivaCuatrimestralDeadlines2024: Record<number, { schedule: Record<string, number>, cuatrimestre: number }> = { 4: {schedule: {'1': 10,'2': 13,'3': 14,'4': 15,'5': 16,'6': 17,'7': 20,'8': 21,'9': 22,'0': 23}, cuatrimestre: 1}, 8: {schedule: {'1': 9,'2': 12,'3': 13,'4': 14,'5': 15,'6': 16,'7': 20,'8': 21,'9': 22,'0': 23}, cuatrimestre: 2}, 12: {schedule: {'1': 10,'2': 13,'3': 14,'4': 15,'5': 16,'6': 17,'7': 20,'8': 21,'9': 22,'0': 23}, cuatrimestre: 3} };

// --- AÑO 2025 ---
const rentaGrandesContribuyentes2025 = {
    c1: { '1': 11, '2': 12, '3': 13, '4': 14, '5': 17, '6': 18, '7': 19, '8': 20, '9': 21, '0': 24 }, // Feb
    c2: { '1': 9, '2': 10, '3': 11, '4': 14, '5': 15, '6': 16, '7': 21, '8': 22, '9': 23, '0': 24 }, // Abr
    c3: { '1': 11, '2': 12, '3': 13, '4': 16, '5': 17, '6': 18, '7': 19, '8': 20, '9': 24, '0': 25 }  // Jun
};
const rentaPjDeadlines2025 = {
    c1: { '1': 12, '2': 13, '3': 14, '4': 15, '5': 16, '6': 19, '7': 20, '8': 21, '9': 22, '0': 23 }, // May
    c2: { '1': 9, '2': 10, '3': 11, '4': 14, '5': 15, '6': 16, '7': 17, '8': 18, '9': 21, '0': 22 }  // Jul
};
const rentaPnDeadlines2025: { range: [number, number], date: { m: number, d: number } }[] = [
    { range: [1, 2], date: { m: 8, d: 12 } }, { range: [3, 4], date: { m: 8, d: 13 } }, { range: [5, 6], date: { m: 8, d: 14 } },
    { range: [7, 8], date: { m: 8, d: 15 } }, { range: [9, 10], date: { m: 8, d: 19 } }, { range: [11, 12], date: { m: 8, d: 20 } },
    { range: [13, 14], date: { m: 8, d: 21 } }, { range: [15, 16], date: { m: 8, d: 22 } }, { range: [17, 18], date: { m: 8, d: 25 } },
    { range: [19, 20], date: { m: 8, d: 26 } }, { range: [21, 22], date: { m: 8, d: 27 } }, { range: [23, 24], date: { m: 8, d: 28 } },
    { range: [25, 26], date: { m: 8, d: 29 } }, { range: [27, 28], date: { m: 9, d: 1 } }, { range: [29, 30], date: { m: 9, d: 2 } },
    { range: [31, 32], date: { m: 9, d: 3 } }, { range: [33, 34], date: { m: 9, d: 4 } }, { range: [35, 36], date: { m: 9, d: 5 } },
    { range: [37, 38], date: { m: 9, d: 8 } }, { range: [39, 40], date: { m: 9, d: 9 } }, { range: [41, 42], date: { m: 9, d: 10 } },
    { range: [43, 44], date: { m: 9, d: 11 } }, { range: [45, 46], date: { m: 9, d: 12 } }, { range: [47, 48], date: { m: 9, d: 15 } },
    { range: [49, 50], date: { m: 9, d: 16 } }, { range: [51, 52], date: { m: 9, d: 17 } }, { range: [53, 54], date: { m: 9, d: 18 } },
    { range: [55, 56], date: { m: 9, d: 19 } }, { range: [57, 58], date: { m: 9, d: 22 } }, { range: [59, 60], date: { m: 9, d: 23 } },
    { range: [61, 62], date: { m: 9, d: 24 } }, { range: [63, 64], date: { m: 9, d: 25 } }, { range: [65, 66], date: { m: 9, d: 26 } },
    { range: [67, 68], date: { m: 10, d: 1 } }, { range: [69, 70], date: { m: 10, d: 2 } }, { range: [71, 72], date: { m: 10, d: 3 } },
    { range: [73, 74], date: { m: 10, d: 6 } }, { range: [75, 76], date: { m: 10, d: 7 } }, { range: [77, 78], date: { m: 10, d: 8 } },
    { range: [79, 80], date: { m: 10, d: 9 } }, { range: [81, 82], date: { m: 10, d: 10 } }, { range: [83, 84], date: { m: 10, d: 14 } },
    { range: [85, 86], date: { m: 10, d: 15 } }, { range: [87, 88], date: { m: 10, d: 16 } }, { range: [89, 90], date: { m: 10, d: 17 } },
    { range: [91, 92], date: { m: 10, d: 20 } }, { range: [93, 94], date: { m: 10, d: 21 } }, { range: [95, 96], date: { m: 10, d: 22 } },
    { range: [97, 98], date: { m: 10, d: 23 } }, { range: [99, 100], date: { m: 10, d: 24 } } // 00 is handled as 100
];
const reteFuenteDeadlines2025: { [periodMonth: number]: { [nit: string]: number } } = {
    1: { '1': 11, '2': 12, '3': 13, '4': 14, '5': 17, '6': 18, '7': 19, '8': 20, '9': 21, '0': 24 }, // Ene -> Feb
    2: { '1': 11, '2': 12, '3': 13, '4': 14, '5': 17, '6': 18, '7': 19, '8': 20, '9': 21, '0': 25 }, // Feb -> Mar
    3: { '1': 9, '2': 10, '3': 11, '4': 14, '5': 15, '6': 16, '7': 21, '8': 22, '9': 23, '0': 24 },  // Mar -> Abr
    4: { '1': 12, '2': 13, '3': 14, '4': 15, '5': 16, '6': 19, '7': 20, '8': 21, '9': 22, '0': 23 }, // Abr -> May
    5: { '1': 11, '2': 12, '3': 13, '4': 16, '5': 17, '6': 18, '7': 19, '8': 20, '9': 24, '0': 25 }, // May -> Jun
    6: { '1': 9, '2': 10, '3': 11, '4': 14, '5': 15, '6': 16, '7': 17, '8': 18, '9': 21, '0': 22 },  // Jun -> Jul
    7: { '1': 9, '2': 10, '3': 11, '4': 12, '5': 15, '6': 16, '7': 17, '8': 18, '9': 19, '0': 22 },  // Jul -> Ago
    8: { '1': 9, '2': 10, '3': 11, '4': 12, '5': 15, '6': 16, '7': 17, '8': 18, '9': 19, '0': 22 },  // Ago -> Sep
    9: { '1': 9, '2': 10, '3': 14, '4': 15, '5': 16, '6': 17, '7': 20, '8': 21, '9': 22, '0': 23 }, // Sep -> Oct
    10: { '1': 12, '2': 13, '3': 14, '4': 18, '5': 19, '6': 20, '7': 21, '8': 24, '9': 25, '0': 26 },// Oct -> Nov
    11: { '1': 10, '2': 11, '3': 12, '4': 15, '5': 16, '6': 17, '7': 18, '8': 19, '9': 22, '0': 23 },// Nov -> Dic
    12: { '1': 13, '2': 14, '3': 15, '4': 16, '5': 19, '6': 20, '7': 21, '8': 22, '9': 23, '0': 26 } // Dic -> Ene 2026
};
const ivaBimestralDeadlines2025: { [bimester: number]: { m: number, schedule: { [nit: string]: number } } } = {
    1: { m: 3, schedule: { '1': 11, '2': 12, '3': 13, '4': 14, '5': 17, '6': 18, '7': 19, '8': 20, '9': 21, '0': 25 } }, // Ene-Feb -> Mar
    2: { m: 5, schedule: { '1': 12, '2': 13, '3': 14, '4': 15, '5': 16, '6': 19, '7': 20, '8': 21, '9': 22, '0': 23 } }, // Mar-Abr -> May
    3: { m: 7, schedule: { '1': 9, '2': 10, '3': 11, '4': 14, '5': 15, '6': 16, '7': 17, '8': 18, '9': 21, '0': 22 } },  // May-Jun -> Jul
    4: { m: 9, schedule: { '1': 9, '2': 10, '3': 11, '4': 12, '5': 15, '6': 16, '7': 17, '8': 18, '9': 19, '0': 22 } },  // Jul-Ago -> Sep
    5: { m: 11, schedule: { '1': 12, '2': 13, '3': 14, '4': 18, '5': 19, '6': 20, '7': 21, '8': 24, '9': 25, '0': 26 } },// Sep-Oct -> Nov
    6: { m: 1, schedule: { '1': 13, '2': 14, '3': 15, '4': 16, '5': 19, '6': 20, '7': 21, '8': 22, '9': 23, '0': 26 } }  // Nov-Dic -> Ene 2026
};
const ivaCuatrimestralDeadlines2025: { [cuatrimestre: number]: { m: number, schedule: { [nit: string]: number } } } = {
    1: { m: 5, schedule: { '1': 12, '2': 13, '3': 14, '4': 15, '5': 16, '6': 19, '7': 20, '8': 21, '9': 22, '0': 23 } }, // Ene-Abr -> May
    2: { m: 9, schedule: { '1': 9, '2': 10, '3': 11, '4': 12, '5': 15, '6': 16, '7': 17, '8': 18, '9': 19, '0': 22 } }, // May-Ago -> Sep
    3: { m: 1, schedule: { '1': 13, '2': 14, '3': 15, '4': 16, '5': 19, '6': 20, '7': 21, '8': 22, '9': 23, '0': 26 } }  // Sep-Dic -> Ene 2026
};

// --- Helper Functions ---
const toISODate = (date: Date): string => date.toISOString().split('T')[0];

function findPnDeadline2025(lastTwoDigits: string): { m: number, d: number } | null {
    let num = parseInt(lastTwoDigits, 10);
    if (isNaN(num)) return null;
    if (num === 0) num = 100; // Handle '00' case

    for (const item of rentaPnDeadlines2025) {
        if (num >= item.range[0] && num <= item.range[1]) {
            return item.date;
        }
    }
    return null;
}

export function generateTaxTasksForClient(client: Client, year: number): Partial<Task>[] {
    if (!client.status || client.status === 'Inactivo') {
        return [];
    }
    
    const tasksToCreate: Partial<Task>[] = [];
    const clientName = client.tipoPersona === 'Persona Jurídica' ? client.razonSocial : client.nombreCompleto;
    const id = client.tipoPersona === 'Persona Jurídica' ? client.nit : client.cedula;

    if (!id) return [];

    const lastDigit = id.slice(-1);
    const lastTwoDigits = id.slice(-2);
    const resp = client.responsabilidadesNacionales || { iva: null, consumo: false, rteFte: false, renta: false, exogenas: false };
    const fiscalYear = year;
    const previousYear = fiscalYear - 1;
    
    // --- Lógica para 2024 ---
    if (fiscalYear === 2024) {
        if (resp.renta) {
            if (client.tipoPersona === 'Persona Jurídica') {
                const day = rentaPjDeadlines2024[lastDigit as keyof typeof rentaPjDeadlines2024];
                if (day) {
                    const taskName = `Renta PJ (AG ${previousYear})`;
                    tasksToCreate.push({
                        deadlineId: `${client.id}-${taskName}`, title: taskName, dueDate: toISODate(new Date(fiscalYear, 3, day)),
                        clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar'
                    });
                }
            } else {
                const rentaDate = rentaPnDeadlines2024[lastTwoDigits as keyof typeof rentaPnDeadlines2024];
                if (rentaDate) {
                    const taskName = `Renta PN (AG ${previousYear})`;
                    tasksToCreate.push({
                        deadlineId: `${client.id}-${taskName}`, title: taskName, dueDate: toISODate(new Date(fiscalYear, rentaDate.m, rentaDate.d)),
                        clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar'
                    });
                }
            }
        }
        if (resp.rteFte) {
            for (let periodMonth = 0; periodMonth < 12; periodMonth++) { 
                const deadlineMonth = periodMonth + 1;
                const schedule = reteFuenteDeadlinesByPaymentMonth2024[deadlineMonth];
                if (schedule) {
                    const day = schedule[lastDigit];
                    const taskName = `ReteFuente (${monthShortNames[periodMonth]} ${fiscalYear})`;
                    if(day) {
                        tasksToCreate.push({
                            deadlineId: `${client.id}-${taskName}`, title: taskName, dueDate: toISODate(new Date(fiscalYear, deadlineMonth, day)),
                            clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar'
                        });
                    }
                }
            }
        }
        if (resp.iva === 'bimestral' || resp.consumo) {
            Object.entries(ivaBimestralDeadlines2024).forEach(([deadlineMonth, data]) => {
                const day = data.schedule[lastDigit];
                if (resp.iva === 'bimestral') {
                    const taskName = `IVA (Bim ${data.bimester} ${fiscalYear})`;
                    tasksToCreate.push({
                        deadlineId: `${client.id}-${taskName}`, title: taskName, dueDate: toISODate(new Date(fiscalYear, parseInt(deadlineMonth), day)),
                        clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar'
                    });
                }
                if (resp.consumo) {
                    const taskName = `ImpConsumo (Bim ${data.bimester} ${fiscalYear})`;
                     tasksToCreate.push({
                        deadlineId: `${client.id}-${taskName}`, title: taskName, dueDate: toISODate(new Date(fiscalYear, parseInt(deadlineMonth), day)),
                        clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar'
                    });
                }
            });
        }
        if (resp.iva === 'cuatrimestral') {
             Object.entries(ivaCuatrimestralDeadlines2024).forEach(([deadlineMonth, data]) => {
                const day = data.schedule[lastDigit];
                const taskName = `IVA (Cuatri ${data.cuatrimestre} ${fiscalYear})`;
                tasksToCreate.push({
                    deadlineId: `${client.id}-${taskName}`, title: taskName, dueDate: toISODate(new Date(fiscalYear, parseInt(deadlineMonth), day)),
                    clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar'
                });
            });
        }
        if (resp.exogenas) {
            const taskName = `Exógena (AG ${previousYear})`;
            tasksToCreate.push({
                deadlineId: `${client.id}-${taskName}`, title: taskName, dueDate: toISODate(new Date(fiscalYear, 3, (22 + parseInt(lastDigit, 10)))),
                clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar'
            });
        }
    }
    // --- Lógica para 2025 ---
    else if (fiscalYear === 2025) {
        const isGranContribuyente = client.tipoContribuyente === 'Gran Contribuyente' || client.tipoContribuyente === 'Gran Contribuyente autorretenedor';

        if (resp.renta) {
            let rentaDueDate: Date | null = null;
            if (isGranContribuyente) {
                const dayC1 = rentaGrandesContribuyentes2025.c1[lastDigit as keyof typeof rentaGrandesContribuyentes2025.c1];
                const dayC2 = rentaGrandesContribuyentes2025.c2[lastDigit as keyof typeof rentaGrandesContribuyentes2025.c2];
                const dayC3 = rentaGrandesContribuyentes2025.c3[lastDigit as keyof typeof rentaGrandesContribuyentes2025.c3];
                
                if (dayC1) { tasksToCreate.push({ deadlineId: `${client.id}-Renta GC (AG ${previousYear}) C1`, title: `Renta GC (AG ${previousYear}) C1`, dueDate: toISODate(new Date(fiscalYear, 1, dayC1)), clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar' }); }
                if (dayC2) { 
                    rentaDueDate = new Date(fiscalYear, 3, dayC2);
                    tasksToCreate.push({ deadlineId: `${client.id}-Renta GC (AG ${previousYear}) C2 y Decl.`, title: `Renta GC (AG ${previousYear}) C2 y Decl.`, dueDate: toISODate(rentaDueDate), clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar' });
                }
                if (dayC3) { tasksToCreate.push({ deadlineId: `${client.id}-Renta GC (AG ${previousYear}) C3`, title: `Renta GC (AG ${previousYear}) C3`, dueDate: toISODate(new Date(fiscalYear, 5, dayC3)), clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar' }); }
            } else if (client.tipoPersona === 'Persona Jurídica') {
                const dayC1 = rentaPjDeadlines2025.c1[lastDigit as keyof typeof rentaPjDeadlines2025.c1];
                const dayC2 = rentaPjDeadlines2025.c2[lastDigit as keyof typeof rentaPjDeadlines2025.c2];
                
                if (dayC1) { 
                    rentaDueDate = new Date(fiscalYear, 4, dayC1);
                    tasksToCreate.push({ deadlineId: `${client.id}-Renta PJ (AG ${previousYear}) C1 y Decl.`, title: `Renta PJ (AG ${previousYear}) C1 y Decl.`, dueDate: toISODate(rentaDueDate), clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar' });
                }
                if (dayC2) { tasksToCreate.push({ deadlineId: `${client.id}-Renta PJ (AG ${previousYear}) C2`, title: `Renta PJ (AG ${previousYear}) C2`, dueDate: toISODate(new Date(fiscalYear, 6, dayC2)), clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar' }); }
            } else { // Persona Natural
                const rentaDate = findPnDeadline2025(lastTwoDigits);
                if (rentaDate) {
                    rentaDueDate = new Date(fiscalYear, rentaDate.m - 1, rentaDate.d);
                    tasksToCreate.push({ deadlineId: `${client.id}-Renta PN (AG ${previousYear})`, title: `Renta PN (AG ${previousYear})`, dueDate: toISODate(rentaDueDate), clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar' });
                }
            }
            // Activos en el exterior
            if (rentaDueDate) {
                tasksToCreate.push({ deadlineId: `${client.id}-Activos Ext (AG ${previousYear})`, title: `Activos Ext (AG ${previousYear})`, dueDate: toISODate(rentaDueDate), clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar' });
            }
        }
        
        if (resp.rteFte) {
            for (let periodMonth = 0; periodMonth < 12; periodMonth++) {
                const deadlineMonth = periodMonth + 1; // JS month index -> Calendar month number
                const schedule = reteFuenteDeadlines2025[periodMonth + 1];
                if (schedule) {
                    const day = schedule[lastDigit];
                    const taskName = `ReteFuente (${monthShortNames[periodMonth]} ${fiscalYear})`;
                    const deadlineYear = deadlineMonth === 12 ? fiscalYear + 1 : fiscalYear;
                    const finalDeadlineMonth = deadlineMonth === 12 ? 0 : deadlineMonth;
                    tasksToCreate.push({
                        deadlineId: `${client.id}-${taskName}`, title: taskName, dueDate: toISODate(new Date(deadlineYear, finalDeadlineMonth, day)),
                        clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar'
                    });
                }
            }
        }

        if (resp.iva === 'bimestral' || resp.consumo) {
            Object.entries(ivaBimestralDeadlines2025).forEach(([bimester, data]) => {
                const day = data.schedule[lastDigit];
                const deadlineYear = data.m === 1 ? fiscalYear + 1 : fiscalYear;
                const deadlineMonth = data.m - 1;

                if (resp.iva === 'bimestral') {
                    const taskName = `IVA (Bim ${bimester} ${fiscalYear})`;
                    tasksToCreate.push({ deadlineId: `${client.id}-${taskName}`, title: taskName, dueDate: toISODate(new Date(deadlineYear, deadlineMonth, day)), clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar' });
                }
            });
        }
        
        if (resp.iva === 'cuatrimestral') {
            Object.entries(ivaCuatrimestralDeadlines2025).forEach(([cuatri, data]) => {
                const day = data.schedule[lastDigit];
                const deadlineYear = data.m === 1 ? fiscalYear + 1 : fiscalYear;
                const deadlineMonth = data.m - 1;
                const taskName = `IVA (Cuatri ${cuatri} ${fiscalYear})`;
                tasksToCreate.push({ deadlineId: `${client.id}-${taskName}`, title: taskName, dueDate: toISODate(new Date(deadlineYear, deadlineMonth, day)), clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar' });
            });
        }
    }

    // Tareas internas no dependen del calendario DIAN
    if (client.otherObligations?.revisionMensual) {
        for (let month = 0; month < 12; month++) {
            const taskName = `Revisión Mensual (${monthShortNames[month]} ${fiscalYear})`;
            tasksToCreate.push({
                deadlineId: `${client.id}-${taskName}`,
                title: taskName,
                dueDate: toISODate(new Date(fiscalYear, month + 1, 0)), // Last day of the month
                clientId: client.id, clientName, isAutoGenerated: true, status: 'por-presentar'
            });
        }
    }

    return tasksToCreate;
}

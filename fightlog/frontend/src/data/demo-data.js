// src/data/demo-data.js
// Enthält sämtliche Demo-Datensätze für das Frontend

export const demoData = {
    user: {
        id: 1,
        username: "admin",
        email: "admin@fightlog.com",
        role: "admin",
        name: "Admin Trainer",
        school: "Kampfsport Akademie Berlin",
        beltLevel: "Schwarzgurt 5. Dan - Meister",
        permissions: ["manage_users", "manage_certificates", "manage_exams", "view_all_data", "approve_certificates", "edit_training_history"]
    },
    users: [
        {
            id: 1,
            username: "admin",
            email: "admin@fightlog.com",
            role: "admin",
            name: "Admin Trainer",
            firstName: "Admin",
            lastName: "Trainer",
            school: "Kampfsport Akademie Berlin",
            beltLevel: "Schwarzgurt 5. Dan - Meister",
            permissions: ["manage_users", "manage_certificates", "manage_exams", "view_all_data", "approve_certificates", "edit_training_history"],
            phone: "+49 30 1234567",
            passkeys: ["YubiKey-Admin", "Phone-Admin"]
        },
        {
            id: 2,
            username: "trainer",
            email: "trainer@fightlog.com",
            role: "trainer",
            name: "Tom Trainer",
            firstName: "Tom",
            lastName: "Trainer",
            school: "Kampfsport Akademie Berlin",
            beltLevel: "Schwarzgurt 2. Dan",
            permissions: ["manage_certificates", "manage_exams", "edit_training_history"],
            phone: "+49 30 2345678",
            passkeys: ["Phone-Trainer"]
        },
        {
            id: 3,
            username: "schueler",
            email: "schueler@fightlog.com",
            role: "schueler",
            name: "Sam Schüler",
            firstName: "Sam",
            lastName: "Schüler",
            school: "Kampfsport Akademie Berlin",
            beltLevel: "Gelbgurt",
            permissions: [],
            phone: "+49 30 3456789",
            passkeys: []
        },
        {
            id: 4,
            username: "paul",
            email: "paul.schwarzmann@fightlog.com",
            role: "schueler",
            name: "Paul Schwarzmann",
            firstName: "Paul",
            lastName: "Schwarzmann",
            school: "FightLog Berlin",
            beltLevel: "Orangegurt",
            permissions: [],
            phone: "+49 30 4567890",
            passkeys: []
        }
    ],
    certificates: [
        {
            id: 1,
            title: "Blaugurt Prüfung",
            type: "belt_exam",
            date: "2023-06-15",
            level: "Blaugurt",
            instructor: "Meister Sho Nakamura",
            fileUrl: "certificate_1.pdf",
            status: "approved"
        },
        {
            id: 2,
            title: "Landesmeisterschaft 2023",
            type: "tournament",
            date: "2023-09-20",
            level: "Gold",
            instructor: "Trainerteam Berlin",
            fileUrl: "certificate_2.pdf",
            status: "approved"
        },
        {
            id: 3,
            title: "Selbstverteidigungs-Seminar",
            type: "workshop",
            date: "2023-11-05",
            level: "Teilnahmebestätigung",
            instructor: "Sensei Kimura",
            fileUrl: "certificate_3.pdf",
            status: "pending"
        }
    ],
    exams: [
        {
            id: 1,
            date: "2023-05-12",
            level: "Orangegurt",
            category: "Technik",
            score: 88,
            instructor: "Meister Lee",
            comments: "Sehr gute Stabilität und Kontrolle",
            status: "passed"
        },
        {
            id: 2,
            date: "2023-08-18",
            level: "Grüngurt",
            category: "Formen",
            score: 92,
            instructor: "Sensei Nakamura",
            comments: "Präzise Ausführung, weiter so!",
            status: "passed"
        }
    ],
    trainingHistory: [
        {
            id: 1,
            date: "2024-03-18",
            duration: "90 Minuten",
            focus: "Sparring & Technik",
            intensity: "hoch",
            notes: "Schwerpunkt auf Reaktionsfähigkeit"
        },
        {
            id: 2,
            date: "2024-03-21",
            duration: "75 Minuten",
            focus: "Kata & Formenlauf",
            intensity: "mittel",
            notes: "Detailarbeit an Kata Basai Dai"
        }
    ],
    timeline: [
        {
            id: 1,
            date: "2023-12-15",
            type: "goal",
            label: "Blaugurt erreicht",
            description: "Erfolgreiche Prüfung mit Auszeichnung bestanden",
            icon: "fa-medal"
        },
        {
            id: 2,
            date: "2024-02-02",
            type: "training",
            label: "Intensivtraining Einladung",
            description: "Einladung für Leistungskader erhalten",
            icon: "fa-fire"
        }
    ],
    specialCourses: [
        {
            id: 1,
            title: "Selbstverteidigung Intensiv",
            instructor: "Anna Weber",
            date: "2024-04-15",
            duration: "4 Stunden",
            maxParticipants: 12,
            currentParticipants: 8,
            price: "45€",
            description: "Spezieller Kurs für effektive Selbstverteidigung"
        },
        {
            id: 2,
            title: "Kampfrichter Ausbildung",
            instructor: "Hans Schmidt",
            date: "2024-05-10",
            duration: "8 Stunden",
            maxParticipants: 8,
            currentParticipants: 6,
            price: "120€",
            description: "Offizielle Ausbildung zum Kampfrichter"
        }
    ],
    goals: [
        {
            id: 1,
            title: "Blaugurt erreichen",
            targetDate: "2024-06-30",
            progress: 75,
            category: "Gürtelprüfung",
            status: "in_progress"
        },
        {
            id: 2,
            title: "Erste Platzierung bei Turnier",
            targetDate: "2024-08-15",
            progress: 40,
            category: "Wettkampf",
            status: "in_progress"
        }
    ],
    courses: [
        {
            id: 101,
            title: "Grundlagen Sparring",
            date: "2024-04-02",
            instructor: "Hans Schmidt",
            description: "Technik und leichtes Sparring",
            status: "approved",
            userId: 2
        },
        {
            id: 102,
            title: "Kata Intensiv",
            date: "2024-04-05",
            instructor: "Anna Weber",
            description: "Kata-Feinschliff",
            status: "pending",
            userId: 3
        }
    ]
};

window.fightlogDemoData = demoData;



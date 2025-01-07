export const CONFIG = {
    waypoints: generateRoutes(120),
    markerTypes: ['jet-plane.png', 'aircraft.png', 'monoplane.png', 'small-plane.png'],
    frameRate: 60,

    // Aircraft movement properties
    movement: {
        speed: {
            initial: 500,          // kph
            max: 900,           // kph (sekitar 500 knots)
            min: 0,            // kph
            acceleration: 50,   // kph/s
            deceleration: 30    // kph/s
        },
        
        turn: {
            slack: 15,    // deg/s
            normal: 30,   // deg/s
            tight: 60     // deg/s
            // Interpolation akan dihandle di movement logic
        },
        
        altitude: {
            initial: 100,          // meters
            max: 10668,         // meters (35,000 feet)
            min: 0,            // meters
            climbRate: 5,      // m/s
            descentRate: 5     // m/s
        },
        
        fuel: {
            capacity: 2000,           // kg
            consumptionRate: {
                // Base consumption per kilometer at different phases
                climbing: 4.2,         // kg/km while climbing
                turning: {
                    slack: 3.8,        // kg/km during slack turn
                    normal: 4.0,       // kg/km during normal turn
                    tight: 4.5         // kg/km during tight turn
                }
            }
        }
    }
};

// Fungsi untuk menghasilkan rute
function generateRoutes(totalRoutes) {
    const baseRoutes = [
        [
            [-6.1751, 106.8272], // Jakarta (Monas)
            [-6.2884, 106.7176], // Tangerang
            [-6.4055, 106.8126], // Depok
            [-6.2375, 107.0026], // Bekasi
            [-6.3297, 107.3112], // Cikarang
            [-6.2646, 106.9916],  // Cibubur
            [-6.6026, 106.8042], // Bogor
            [-6.9147, 107.6098] // Bandung
        ],
        [
            [-6.1751, 106.8272], // Jakarta (Monas)
            [-6.2646, 106.9916], // Cibubur
            [-6.2884, 106.7176], // Tangerang
            [-6.6026, 106.8042], // Bogor
            [-7.7956, 110.3695], // Yogyakarta
            [-7.5655, 110.8317], // Surakarta
            [-6.9932, 110.4229], // Semarang
            [-6.9147, 107.6098] // Bandung
        ],
        [
            [-6.1751, 106.8272], // Jakarta
            [-6.6026, 106.8042], // Bogor
            [-6.9147, 107.6098], // Bandung
            [-6.8915, 109.6753], // Pekalongan
            [-6.7695, 108.5508],  // Cirebon
            [-6.9932, 110.4229],  // Semarang
            [-6.6026, 106.8042], // Bogor
            [-6.9147, 107.6098] // Bandung
        ],
    ];

    const generatedRoutes = {};

    for (let i = 1; i <= totalRoutes; i++) {
        const baseRoute = baseRoutes[i % baseRoutes.length]; // Ambil pola dari baseRoutes
        const newRoute = baseRoute.map(([lat, lng]) => [
            lat + (Math.random() - 0.5) * 0.1, // Tambahkan variasi latitude
            lng + (Math.random() - 0.5) * 0.1, // Tambahkan variasi longitude
        ]);

        // Tambahkan tipe belokan secara acak
        const turnTypes = ["tight", "normal", "slack"];
        const turns = newRoute.map(() => turnTypes[Math.floor(Math.random() * turnTypes.length)]);


        generatedRoutes[`route${i}`] = { route: newRoute, turn: turns };
    }

    return generatedRoutes;
}


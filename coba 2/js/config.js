export const CONFIG = {
    waypoints: generateRoutes(1000),
    markerTypes: ['jet-plane.png', 'aircraft.png', 'monoplane.png', 'small-plane.png'],
    frameRate: 60,

    // Aircraft properties
    movement: {
        speed: {
            initial: 500,
            max: 50000,
            min: 0,
            acceleration: 50,
            deceleration: 30
        },
        
        turn: {
            slack: 15,
            normal: 30,
            tight: 60
        },
        
        altitude: {
            initial: 100,
            max: 10668,
            min: 0,
            climbRate: 5,
            descentRate: 5
        },
        
        fuel: {
            capacity: 800,
            consumptionRate: {
                climbing: 4.2,
                cruising: 3.5,
                turning: {
                    slack: 3.8,
                    normal: 4.0,
                    tight: 4.5
                }
            }
        }
    }
};

// Fungsi generate rute
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
            lat + (Math.random() - 0.5) * 0.1, // Variasi latitude
            lng + (Math.random() - 0.5) * 0.1, // Variasi longitude
        ]);

        // Tipe belokan secara acak
        const turnTypes = ["slack", "normal", "tight"];
        const turns = newRoute.map(() => turnTypes[Math.floor(Math.random() * turnTypes.length)]);

        generatedRoutes[`route${i}`] = { route: newRoute, turn: turns };
    }

    return generatedRoutes;
}


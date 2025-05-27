export const CONFIG = {
    waypoints: generateRoutes(100),
    markerTypes: ['jet-plane.png', 'aircraft.png', 'monoplane.png', 'small-plane.png'],
    frameRate: 60,

    // Aircraft properties
    movement: {
        speed: {
            initial: 5000,
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
            capacity: 80000,
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
            [-6.11981, 106.65700], // WIII
            [-6.54399, 107.94100], // KASAL
            [-6.69798, 108.56000], // CA (NDB)
            [-6.79036, 110.13700], // PIALA
            [-6.97469, 110.38000], // ANY (VOR)
            [-6.99264, 111.41900], // BA (NDB)
            [-7.37983, 112.78700]  // WARR
        ],
        [
            [-6.11981, 106.65700], // WIII
            [-6.54399, 107.94100], // KASAL
            [-6.79036, 110.13700], // PIALA
            [-7.5655, 110.8317]    // WARS (Yogyakarta)
        ],
        [
           [-6.11981, 106.65700], // WIII
            [-6.6026, 106.8042],   // BOGOR (titik fix alternatif)
            [-6.79036, 110.13700], // PIALA
            [-6.9932, 110.4229]    // WASS (Semarang)
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


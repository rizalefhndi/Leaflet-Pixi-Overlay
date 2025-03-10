export const CONFIG = {
    waypoints: generateRoutes(100),
    frameRate: 60,

    engineTypes: {
        pixi: {
            markers: ['jet-plane.png', 'aircraft.png'],
            characteristics: {
                speed: {
                    initial: 7000,
                    max: 50000,
                    min: 1000,
                    acceleration: 70,
                    deceleration: 50
                },
                turn: {
                    min: 30,
                    max: 60,
                    rate: 1.5
                },
                altitude: {
                    initial: 300,
                    max: 10668,
                    min: 100,
                    climbRate: 8
                }
            }
        },
        motion: {
            markers: ['monoplane.png', 'small-plane.png'],
            characteristics: {
                speed: {
                    initial: 5000,
                    max: 30000,
                    min: 500,
                    acceleration: 40,
                    deceleration: 30
                },
                turn: {
                    min: 15,
                    max: 30,
                    rate: 1.0
                },
                altitude: {
                    initial: 100,
                    max: 5000,
                    min: 0,
                    climbRate: 5
                }
            }
        }
    },

    common: {
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

function generateRoutes(totalRoutes) {
    const generatedRoutes = {};
    
    // Use the BASE_ROUTES from your paste.txt file
    const BASE_ROUTES = [
        [
            [-6.1751, 106.8272], // Jakarta (Monas)
            [-6.2884, 106.7176], // Tangerang
            [-6.4055, 106.8126], // Depok
            [-6.2375, 107.0026], // Bekasi
            [-6.3297, 107.3112], // Cikarang
            [-6.2646, 106.9916], // Cibubur
            [-6.6026, 106.8042], // Bogor
            [-6.9147, 107.6098]  // Bandung
        ],
        [
            [-6.1751, 106.8272], // Jakarta (Monas)
            [-6.2646, 106.9916], // Cibubur
            [-6.2884, 106.7176], // Tangerang
            [-6.6026, 106.8042], // Bogor
            [-7.7956, 110.3695], // Yogyakarta
            [-7.5655, 110.8317], // Surakarta
            [-6.9932, 110.4229], // Semarang
            [-6.9147, 107.6098]  // Bandung
        ],
        [
            [-6.1751, 106.8272], // Jakarta
            [-6.6026, 106.8042], // Bogor
            [-6.9147, 107.6098], // Bandung
            [-6.8915, 109.6753], // Pekalongan
            [-6.7695, 108.5508], // Cirebon
            [-6.9932, 110.4229], // Semarang
            [-6.6026, 106.8042], // Bogor
            [-6.9147, 107.6098]  // Bandung
        ]
    ];

    for (let i = 1; i <= totalRoutes; i++) {
        const baseRoute = BASE_ROUTES[i % BASE_ROUTES.length];
        const newRoute = baseRoute.map(([lat, lng]) => [
            lat + (Math.random() - 0.5) * 0.1,
            lng + (Math.random() - 0.5) * 0.1,
        ]);

        const turnTypes = ["slack", "normal", "tight"];
        const turns = newRoute.map(() => turnTypes[Math.floor(Math.random() * turnTypes.length)]);
        
        // Add complexity value (higher means more complex route -> use pixi)
        const complexity = newRoute.length + Math.random() * 50;
        
        // Determine engine type based on complexity
        const engineType = complexity > 45 ? 'pixi' : 'motion';

        generatedRoutes[`route${i}`] = {
            route: newRoute,
            turn: turns,
            engineType: engineType,
            complexity: complexity
        };
    }

    return generatedRoutes;
}
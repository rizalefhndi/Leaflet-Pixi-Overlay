export const CONFIG = {
    waypoints: generateRoutes(1),
    markerTypes: ['jet-plane.png', 'aircraft.png', 'monoplane.png', 'small-plane.png'],
    initialSpeed: 100,
    acceleration: 50,
    decceleration: 100,
    maxSpeed: 10000,
    maxSpeedMultiplier: 3,
    distanceThreshold: 1000,
};

function generateRoutes(totalRoutes) {
    const baseRoutes = [
        [
            [-6.1751, 106.8272], // Jakarta (Monas)
            [-6.2884, 106.7176], // Tangerang
            [-6.4055, 106.8126], // Depok
            [-6.2375, 107.0026], // Bekasi
            [-6.3297, 107.3112], // Cikarang
            [-6.2646, 106.9916], // Cibubur
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
            [-6.7695, 108.5508], // Cirebon
            [-6.8915, 109.6753], // Pekalongan
            [-6.9932, 110.4229], // Semarang
            [-6.6026, 106.8042], // Bogor
            [-6.9147, 107.6098] // Bandung
        ],
    ];

    const generatedRoutes = [];

    for (let i = 1; i <= totalRoutes; i++) {
        const baseRoute = baseRoutes[i % baseRoutes.length];
        const newRoute = baseRoute.map(([lat, lng]) => [
            lat + (Math.random() - 0.5) * 0.1,
            lng + (Math.random() - 0.5) * 0.1,
        ]);

        // generatedRoutes[`route${i}`] = newRoute;
        generatedRoutes.push(newRoute);

    }

    return generatedRoutes;
}

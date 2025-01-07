// export const CONFIG = {
//     waypoints: [
//         [-6.1751, 106.8272], // Jakarta (Monas)
//         [-6.2884, 106.7176], // Tangerang
//         [-6.4055, 106.8126], // Depok
//         [-6.2375, 107.0026], // Bekasi
//         [-6.3297, 107.3112], // Cikarang
//         [-6.2646, 106.9916], // Cibubur
//         [-6.6026, 106.8042], // Bogor
//         [-6.9147, 107.6098], // Bandung
//         [-6.7695, 108.5508], // Cirebon
//         [-6.8915, 109.6753], // Pekalongan
//         [-6.9932, 110.4229]  // Semarang
//     ],
//     initialSpeed: 0.0001,     // Kecepatan awal yang lebih sesuai
//     acceleration: 0.00001,   // Percepatan yang sangat halus
//     frameRate: 60
// };

// export const CONFIG = {
//     waypoints: {
//         route1: [
//             [-6.1751, 106.8272], // Jakarta (Monas)
//             [-6.2884, 106.7176], // Tangerang
//             [-6.4055, 106.8126], // Depok
//             [-6.2375, 107.0026], // Bekasi
//             [-6.3297, 107.3112], // Cikarang
//             [-6.2646, 106.9916],  // Cibubur
//             [-6.6026, 106.8042], // Bogor
//             [-6.9147, 107.6098] // Bandung
//         ],
//         route2: [
//             [-6.6026, 106.8042], // Bogor
//             [-6.1751, 106.8272], // Jakarta
//             [-6.9147, 107.6098], // Bandung
//             [-6.7695, 108.5508],  // Cirebon
//             [-6.8915, 109.6753], // Pekalongan
//             [-6.9932, 110.4229],  // Semarang
//             [-6.6026, 106.8042], // Bogor
//             [-6.9147, 107.6098] // Bandung
//         ],
//         route3: [
//             [-6.2884, 106.7176], // Tangerang
//             [-6.1751, 106.8272], // Jakarta (Monas)
//             [-6.2646, 106.9916], // Cibubur
//             [-6.6026, 106.8042], // Bogor
//             [-7.7956, 110.3695], // Yogyakarta
//             [-7.5655, 110.8317], // Surakarta
//             [-6.9932, 110.4229], // Semarang
//             [-6.8915, 109.6753]  // Pekalongan
          
//         ],
//         route4: [
//             [-6.2375, 107.0026], // Bekasi
//             [-6.8915, 109.6753], // Pekalongan
//             [-6.9932, 110.4229], // Semarang
//             [-8.6500, 115.2167], // Denpasar
//             [-8.5933, 116.1004], // Mataram
//             [-8.4855, 117.4121], // Sumbawa
//             [-8.6225, 118.7287]  // Bima
            
//         ],
//         route5: [
//             [-6.4055, 106.8126], // Depok
//             [-6.9932, 110.4229],  // Semarang
//             [-6.8915, 109.6753], // Pekalongan
//             [-0.9431, 100.3716], // Padang
//             [-1.6146, 103.6131], // Jambi
//             [-2.9901, 104.7557], // Palembang
//             [-3.7928, 102.2608]  // Bengkulu
            
//         ]
//     },
//     markerTypes: [
//         'jet-plane.png',
//         'aircraft.png',
//         'monoplane.png',
//         'small-plane.png'
//     ],
//     initialSpeed: 0.01,
//     acceleration: 0.01,
//     frameRate: 60,
//     maxSpeedMultiplier: 3,
//     distanceThreshold: 1000
// };


export const CONFIG = {
    waypoints: generateRoutes(1000), // Generate 1000 routes
    markerTypes: ['jet-plane.png', 'aircraft.png', 'monoplane.png', 'small-plane.png'],
    initialSpeed: 0.01,
    acceleration: 0.01,
    frameRate: 60,
    maxSpeedMultiplier: 3,
    distanceThreshold: 1000,
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
            [-6.7695, 108.5508],  // Cirebon
            [-6.8915, 109.6753], // Pekalongan
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

        generatedRoutes[`route${i}`] = newRoute; // Tambahkan rute baru ke objek
    }

    return generatedRoutes;
}


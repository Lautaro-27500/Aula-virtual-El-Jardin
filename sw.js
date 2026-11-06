// Service Worker de la App
const VERSION = "v1";

// Lista de TODOS los archivos que la app necesita para funcionar sin internet
const ARCHIVOS = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json",
    "./icono-192.png",
    "./icono-512.png"
];

// Evento install: Se dispara la primera vez y guarda los archivos en la caché (como descargar la app)
self.addEventListener("install", (evento) => {
    evento.waitUntil(
        caches.open(VERSION).then((cache) => {
            return cache.addAll(ARCHIVOS);
        })
    );
});

// Evento activate: Borra las versiones viejas de la caché si cambiamos la constante VERSION
self.addEventListener("activate", (evento) => {
    evento.waitUntil(
        caches.keys().then((claves) => {
            return Promise.all(
                claves.map((clave) => {
                    if (clave !== VERSION) {
                        return caches.delete(clave);
                    }
                })
            );
        })
    );
});

// Evento fetch: Intercepta las peticiones y responde primero con la copia guardada (estrategia "primero la caché")
self.addEventListener("fetch", (evento) => {
    evento.respondWith(
        caches.match(evento.request).then((respuesta) => {
            // Si está en caché, la devuelve. Si no, va a internet a buscarla.
            return respuesta || fetch(evento.request);
        })
    );
});
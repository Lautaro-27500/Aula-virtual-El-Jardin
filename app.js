// Registro de IA: Código base generado para el simulador del aula virtual.

// --- 1. MODO DOCENTE / ALUMNO ---
const selectorRol = document.getElementById("selector-rol");
let modo = localStorage.getItem("aula-modo") || "docente";
selectorRol.value = modo;

function aplicarModo() {
    document.body.setAttribute("data-modo", modo);
}

selectorRol.addEventListener("change", function(evento) {
    modo = evento.target.value;
    localStorage.setItem("aula-modo", modo);
    aplicarModo();
    renderizarCursos(); 
});
aplicarModo();

// --- 2. MOSTRAR Y OCULTAR VISTAS ---
function mostrarVista(idVista) {
    document.querySelectorAll("main section").forEach(vista => vista.hidden = true);
    const vistaActiva = document.getElementById(idVista);
    if (vistaActiva) vistaActiva.hidden = false;
}

// --- 3. LOCALSTORAGE ---
function obtenerDatos() {
    const porDefecto = { cursos: [], materiales: [], tareas: [], entregas: [] };
    const guardados = localStorage.getItem("aula-datos");
    return guardados ? JSON.parse(guardados) : porDefecto;
}
function guardarDatos(datos) { localStorage.setItem("aula-datos", JSON.stringify(datos)); }

// --- 4 a 6. LÓGICA DE CURSOS ---
function renderizarCursos() {
    const datos = obtenerDatos();
    const grilla = document.getElementById("grilla-cursos");
    grilla.innerHTML = "";
    datos.cursos.forEach(curso => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-curso";
        tarjeta.style.borderTopColor = curso.color;
        tarjeta.innerHTML = `
            <h3>${curso.nombre}</h3><p><strong>Código:</strong> ${curso.codigo}</p><p><strong>Docente:</strong> ${curso.docente}</p>
            <button class="btn-entrar-curso" onclick="abrirCurso(${curso.id})">Entrar al Muro</button>
        `;
        if (modo === "docente") {
            const btnBorrar = document.createElement("button");
            btnBorrar.textContent = "Borrar"; btnBorrar.style.backgroundColor = "#ff4d4d"; btnBorrar.style.marginTop = "10px";
            btnBorrar.onclick = () => borrarCurso(curso.id);
            tarjeta.appendChild(btnBorrar);
        }
        grilla.appendChild(tarjeta);
    });
}

document.getElementById("formulario-crear-curso").addEventListener("submit", function(e) {
    e.preventDefault();
    const nombre = document.getElementById("input-nombre-curso").value.trim();
    const codigo = document.getElementById("input-codigo-curso").value.trim();
    const docente = document.getElementById("input-docente-curso").value.trim();
    const color = document.getElementById("input-color-curso").value;
    
    if (nombre === "") return alert("El nombre no puede estar vacío.");
    
    const datos = obtenerDatos();
    if (datos.cursos.find(c => c.codigo === codigo)) return alert("El código ya existe.");
    
    datos.cursos.push({ id: Date.now(), nombre, codigo, docente, color });
    guardarDatos(datos); this.reset(); renderizarCursos();
});

function borrarCurso(id) {
    if (confirm("¿Borrar curso?")) {
        const datos = obtenerDatos();
        datos.cursos = datos.cursos.filter(c => c.id !== id);
        datos.materiales = datos.materiales.filter(m => m.idCurso !== id);
        datos.tareas = datos.tareas.filter(t => t.idCurso !== id);
        guardarDatos(datos); renderizarCursos();
    }
}

// --- 7. ABRIR CURSO E INICIALIZAR MURO ---
let cursoActualId = null;
let tareaActualId = null;

document.getElementById("btn-volver-cursos").addEventListener("click", () => { mostrarVista("vista-mis-cursos"); cursoActualId = null; });
document.getElementById("btn-volver-muro").addEventListener("click", () => { mostrarVista("vista-curso"); tareaActualId = null; renderizarMuro(); });

function abrirCurso(idCurso) {
    cursoActualId = idCurso;
    document.getElementById("titulo-curso-actual").textContent = obtenerDatos().cursos.find(c => c.id === idCurso).nombre;
    mostrarVista("vista-curso");
    renderizarMuro();
}

// --- 8. LÓGICA DEL MURO (Materiales y Tareas) ---
const selectorTipo = document.getElementById("selector-tipo-publicacion");
const campos = { 
    texto: document.getElementById("input-contenido-texto"), 
    enlace: document.getElementById("input-contenido-enlace"), 
    archivo: document.getElementById("input-contenido-archivo"), 
    tarea: document.getElementById("campos-tarea") 
};

selectorTipo.addEventListener("change", function() {
    Object.values(campos).forEach(c => { if(c) c.hidden = true; });
    if (this.value === "texto" || this.value === "tarea") campos.texto.hidden = false;
    if (this.value === "enlace") campos.enlace.hidden = false;
    if (this.value === "archivo") campos.archivo.hidden = false;
    if (this.value === "tarea" && campos.tarea) campos.tarea.hidden = false;
});

document.getElementById("formulario-publicar").addEventListener("submit", function(e) {
    e.preventDefault();
    const titulo = document.getElementById("input-titulo-publicacion").value.trim();
    const tipo = selectorTipo.value;
    const datos = obtenerDatos();

    if (tipo === "tarea") {
        const consigna = campos.texto.value.trim();
        const fechaLimite = prompt("Ingresá la fecha límite (Ej: 2026-11-20):", "2026-11-20");
        const puntajeMaximo = prompt("Ingresá el puntaje máximo:", "100");
        
        if (!consigna || !fechaLimite || !puntajeMaximo) return alert("Consigna, fecha y puntaje son obligatorios.");
        datos.tareas.push({ id: Date.now(), idCurso: cursoActualId, titulo, consigna, fechaLimite, puntajeMaximo });
    } else {
        let contenido = "";
        if (tipo === "texto") contenido = campos.texto.value.trim();
        else if (tipo === "enlace") contenido = campos.enlace.value.trim();
        else if (tipo === "archivo") {
            if (campos.archivo.files.length > 0) contenido = campos.archivo.files[0].name;
            else return alert("Debes seleccionar un archivo.");
        }
        datos.materiales.push({ id: Date.now(), idCurso: cursoActualId, titulo, tipo, contenido });
    }

    guardarDatos(datos); this.reset(); selectorTipo.dispatchEvent(new Event('change')); renderizarMuro();
});

function renderizarMuro() {
    const datos = obtenerDatos();
    const lista = document.getElementById("lista-publicaciones");
    lista.innerHTML = "";

    let pubMateriales = datos.materiales.filter(m => m.idCurso === cursoActualId).map(m => ({ ...m, esTarea: false }));
    let pubTareas = datos.tareas.filter(t => t.idCurso === cursoActualId).map(t => ({ ...t, esTarea: true }));
    let publicaciones = [...pubMateriales, ...pubTareas].sort((a, b) => b.id - a.id);

    publicaciones.forEach(pub => {
        const li = document.createElement("li");
        li.className = "publicacion";
        
        if (pub.esTarea) {
            li.innerHTML = `<h3>🎯 ${pub.titulo}</h3><p><strong>Vence:</strong> ${pub.fechaLimite}</p>
                            <button onclick="abrirTarea(${pub.id})" style="margin-top:10px;">Ver Tarea</button>`;
        } else {
            let icono = pub.tipo === "texto" ? "📝" : pub.tipo === "enlace" ? "🔗" : "📄";
            let cont = pub.tipo === "enlace" ? `<a href="${pub.contenido}" target="_blank">Ver Enlace</a>` : `<p>${pub.contenido}</p>`;
            li.innerHTML = `<h3>${icono} ${pub.titulo}</h3>${cont}`;
        }

        if (modo === "docente") {
            const btnBorrar = document.createElement("button");
            btnBorrar.textContent = "Borrar"; btnBorrar.style.backgroundColor = "#ff4d4d"; btnBorrar.style.marginTop = "10px";
            btnBorrar.onclick = () => {
                if (confirm("¿Borrar publicación?")) {
                    if (pub.esTarea) datos.tareas = datos.tareas.filter(t => t.id !== pub.id);
                    else datos.materiales = datos.materiales.filter(m => m.id !== pub.id);
                    guardarDatos(datos); renderizarMuro();
                }
            };
            li.appendChild(btnBorrar);
        }
        lista.appendChild(li);
    });
}

// --- 9. LÓGICA DE TAREAS Y ENTREGAS (Actualizada con Foto/Canvas) ---
function abrirTarea(id) {
    tareaActualId = id;
    mostrarVista("vista-tarea");
    
    const datos = obtenerDatos();
    const tarea = datos.tareas.find(t => t.id === tareaActualId);
    
    document.getElementById("titulo-tarea-actual").textContent = "🎯 " + tarea.titulo;
    document.getElementById("texto-consigna").textContent = tarea.consigna;
    
    document.getElementById("formulario-entrega").reset();
    document.getElementById("mensaje-entrega-estado").textContent = "";
    
    const listaEntregas = document.getElementById("lista-entregas");
    listaEntregas.innerHTML = "";
    if (modo === "docente") {
        const entregas = datos.entregas.filter(e => e.idTarea === tareaActualId);
        if (entregas.length === 0) listaEntregas.innerHTML = "<li>Nadie entregó aún.</li>";
        else {
            entregas.forEach(e => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>${e.nombreAlumno}</strong> - <span>${e.fechaHora}</span> 
                                <span style="color: ${e.estado === 'a tiempo' ? 'green' : 'red'}">(${e.estado})</span>
                                <p>${e.contenido}</p>`;
                if(e.fotoUrl) {
                    li.innerHTML += `<br><img src="${e.fotoUrl}" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">`;
                }
                listaEntregas.appendChild(li);
            });
        }
    }
}

document.getElementById("formulario-entrega").addEventListener("submit", async function(e) {
    e.preventDefault();
    const nombreAlumno = document.getElementById("input-nombre-alumno").value.trim();
    const contenido = document.getElementById("input-respuesta-tarea").value.trim();
    const inputFoto = document.getElementById("input-foto-entrega");
    
    let fotoBase64 = null;

    if (inputFoto.files && inputFoto.files.length > 0) {
        const archivo = inputFoto.files[0];
        fotoBase64 = await procesarFoto(archivo);
        
        const pesoKB = Math.round((fotoBase64.length * (3/4)) / 1024);
        if (pesoKB > 200) {
            alert(`Aviso: La foto pesa ${pesoKB} KB. Recordá que el almacenamiento del celular es limitado.`);
        }
    }

    const datos = obtenerDatos();
    const tarea = datos.tareas.find(t => t.id === tareaActualId);
    
    const indicePrevio = datos.entregas.findIndex(e => e.idTarea === tareaActualId && e.nombreAlumno.toLowerCase() === nombreAlumno.toLowerCase());
    
    if (indicePrevio !== -1) {
        if (datos.entregas[indicePrevio].nota !== null) return alert("Tu tarea ya fue corregida, no podés editarla.");
        if (!confirm("Ya tenés una entrega. ¿Querés reemplazarla?")) return;
    }

    const ahora = new Date();
    const limite = new Date(tarea.fechaLimite + "T23:59:59");
    const estado = ahora > limite ? "tarde" : "a tiempo";

    const nuevaEntrega = {
        id: Date.now(),
        idTarea: tareaActualId,
        nombreAlumno,
        contenido,
        fotoUrl: fotoBase64,
        fechaHora: ahora.toLocaleString(),
        estado: estado,
        nota: null 
    };

    if (indicePrevio !== -1) datos.entregas[indicePrevio] = nuevaEntrega;
    else datos.entregas.push(nuevaEntrega);

    guardarDatos(datos);
    const mensaje = document.getElementById("mensaje-entrega-estado");
    mensaje.textContent = `¡Entregado! Estado: ${estado}`;
    mensaje.style.color = estado === "a tiempo" ? "green" : "red";
});

function procesarFoto(archivo) {
    return new Promise((resolve) => {
        const lector = new FileReader();
        lector.onload = function(evento) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                const anchoDeseado = 800;
                const proporcion = anchoDeseado / img.width;
                canvas.width = anchoDeseado;
                canvas.height = img.height * proporcion;
                
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                resolve(canvas.toDataURL("image/jpeg", 0.6));
            };
            img.src = evento.target.result;
        };
        lector.readAsDataURL(archivo);
    });
}

// --- 10. EXPORTAR E IMPORTAR DATOS ---
document.getElementById("btn-exportar").addEventListener("click", function() {
    const datos = obtenerDatos();
    datos.modo = modo; 

    const datosTexto = JSON.stringify(datos, null, 2);
    const blob = new Blob([datosTexto], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "aula.json";
    enlace.click();
    
    URL.revokeObjectURL(url);
});

const btnImportar = document.getElementById("btn-importar");
const inputImportar = document.getElementById("input-importar");

btnImportar.addEventListener("click", function() {
    inputImportar.click();
});

inputImportar.addEventListener("change", function(evento) {
    const archivo = evento.target.files[0];
    if (!archivo) return; 

    const lector = new FileReader();
    
    lector.onload = function(e) {
        try {
            const datosNuevos = JSON.parse(e.target.result);

            if (!Array.isArray(datosNuevos.cursos) || 
                !Array.isArray(datosNuevos.materiales) || 
                !Array.isArray(datosNuevos.tareas) || 
                !Array.isArray(datosNuevos.entregas)) {
                throw new Error("Estructura inválida");
            }

            if (confirm("⚠️ ¡Atención! Importar estos datos borrará y reemplazará TODO lo que tenés ahora. ¿Querés continuar?")) {
                if (datosNuevos.modo) {
                    modo = datosNuevos.modo;
                    localStorage.setItem("aula-modo", modo);
                    document.getElementById("selector-rol").value = modo;
                    aplicarModo();
                    delete datosNuevos.modo;
                }
                
                guardarDatos(datosNuevos);
                alert("Datos importados correctamente.");
                
                mostrarVista("vista-mis-cursos");
                renderizarCursos();
            }
        } catch (error) {
            alert("❌ Error: El archivo está corrupto o no pertenece a esta aplicación.");
        } finally {
            inputImportar.value = "";
        }
    };
    lector.readAsText(archivo);
});

renderizarCursos();

// --- 11. REGISTRO DEL SERVICE WORKER (Paso 4) ---
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
    .then(() => console.log("Service Worker registrado con éxito."))
    .catch((error) => console.log("Error al registrar el Service Worker:", error));
}

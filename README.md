# Prueba técnica Khipu Integration Demo
## Primeros pasos
```
1. Clonar el repositorio con el comando git clone
```

```
2. Para instalar dependencias utilizar el comando npm install
```

```
3. Para correr el proyecto utilizar el comando npm start
```

## Vistas disponibles (FE)
- Catálogo de productos: http://localhost:3000/index.html
- Formulario de pago: http://localhost:3000/formulario.html
- Éxito de pago: http://localhost:3000/exitoso.html
- Pago cancelado: http://localhost:3000/cancelado.html

## Endpoints disponibles (BE)
### POST /crear-cobro
### GET /estado-pago/:payment_id
### GET /cancelado/:payment_id 

# 🛠 Tecnologías Utilizadas
- Node.js (v18+ con fetch nativo)
- Express para routing y middleware
- FS y path para leer/escribir productos.json
- Khipu API v3 para creación y consulta de pagos
- LocalStorage + HTML/JS vanilla en el frontend

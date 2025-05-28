
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pagos = [];
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/crear-cobro', async (req, res) => {
  try {
    
    const { producto: productos, nombreCliente, email } = req.body;
    const producto = productos[0];
   
    const response = await fetch(`${process.env.KHIPU_BASE_URL}/v3/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.KHIPU_API_KEY
      },
      body: JSON.stringify({
        amount: +producto.precio || 2500,
        currency: 'CLP',
        subject: `Muchas gracias ${nombreCliente} por tu compra de: ${producto.nombre} en la tienda de Lucas Rotta Desarrollador`,
        body: producto.descripcion || 'Descripción no disponible',
        return_url: `http://localhost:3000/exitoso.html`,
        cancel_url: 'http://localhost:3000/cancelado.html',
        picture_url: producto.imagen,
        payer_name: nombreCliente,
        payer_email: email,
        send_email: true,
      })
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error desde Khipu', detalle: text });
    }

    const data = JSON.parse(text);

    pagos.push({
      payment_id: data.payment_id,
      producto,
      nombreCliente,
      email,
      pagado: false
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al conectar con Khipu' });
  }
});

app.get('/estado-pago/:id', async (req, res) => {
  const payment_id = req.params.id;
  const pago = pagos.find(p => p.payment_id === payment_id);

  if (!pago) {
    return res.status(404).json({ error: 'Pago no encontrado' });
  }

  try {
    const response = await fetch(`${process.env.KHIPU_BASE_URL}/v3/payments/${payment_id}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.KHIPU_API_KEY
      }
    });

    const data = await response.json();

    if (data.status === 'done' && !pago.pagado) {
     
      const filePath = path.join(__dirname, 'public', 'data', 'productos.json');
      const productosData = fs.readFileSync(filePath, 'utf8');
      const productos = JSON.parse(productosData);

      const productoIndex = productos.findIndex(p => p.id === pago.producto.id);

      if (productoIndex === -1) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      if (productos[productoIndex].stock <= 0) {
        return res.status(400).json({ error: 'Sin stock disponible' });
      }
      
      productos[productoIndex].stock -= 1;
      fs.writeFileSync(filePath, JSON.stringify(productos, null, 2));
      pago.pagado = true;
    }

    res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar el estado del pago' });
  }
});


app.get('/cancelado/:payment_id', async (req, res) => {
  const { payment_id } = req.params;
  console.log('Cancelando pago con ID:', payment_id);

  try {
    const url = `${process.env.KHIPU_BASE_URL}/v3/payments/${payment_id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'x-api-key': process.env.KHIPU_API_KEY
      }
    });
    console.log('Khipu DELETE status:', response.status);
  } catch (err) {
    console.error('Error en DELETE /payments/:id', err);
  }

  // luego sirvo la página estática con meta-refresh
  res.sendFile(path.join(__dirname, 'public', 'cancelado.html'));
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// ==========================================
//  INVENTARIO MÉDICO - BACKEND COMPLETO
//  TIPADO PARA TYPESCRIPT ✔
//  EXPRESS + JWT + NEON (PostgreSQL)
// ==========================================

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { pool } from './db';
import { generateToken, authMiddleware, AuthRequest } from './auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

/* ============================================
   =============== AUTENTICACIÓN ===============
   ============================================ */

// Login
app.post(
  '/api/auth/login',
  [body('username').notEmpty(), body('password').notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { username, password } = req.body;
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

      if (result.rows.length === 0)
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword)
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

      const token = generateToken(user.id);
      res.json({ token, username: user.username });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }
);

// Registrar usuario
app.post(
  '/api/auth/register',
  [body('username').isLength({ min: 3 }), body('password').isLength({ min: 6 })],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
        [username, hashedPassword]
      );

      const token = generateToken(result.rows[0].id);
      res.status(201).json({ token, username: result.rows[0].username });
    } catch (error: any) {
      if (error.code === '23505')
        return res.status(400).json({ error: 'El usuario ya existe' });

      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }
);

// Ver sesión
app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT id, username FROM users WHERE id = $1', [
      req.userId
    ]);
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/* ============================================
   ========= STORAGE PRINCIPAL =================
   ============================================ */

app.get('/api/storage-principal', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM storage_principal ORDER BY fecha_entrada DESC'
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

app.post(
  '/api/storage-principal',
  authMiddleware,
  [body('nombre').notEmpty(), body('cantidad').isInt({ min: 1 }), body('categoria').optional()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { nombre, cantidad, categoria } = req.body;

      const existing = await pool.query(
        'SELECT * FROM storage_principal WHERE nombre = $1',
        [nombre]
      );

      if (existing.rows.length > 0) {
        const newCantidad = existing.rows[0].cantidad + cantidad;

        const result = await pool.query(
          'UPDATE storage_principal SET cantidad = $1, updated_at = CURRENT_TIMESTAMP WHERE nombre = $2 RETURNING *',
          [newCantidad, nombre]
        );

        return res.json({ message: 'Cantidad actualizada', data: result.rows[0] });
      }

      const result = await pool.query(
        'INSERT INTO storage_principal (nombre, cantidad, categoria) VALUES ($1, $2, $3) RETURNING *',
        [nombre, cantidad, categoria]
      );

      res.status(201).json({ message: 'Producto agregado', data: result.rows[0] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al agregar producto' });
    }
  }
);

app.put('/api/storage-principal/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, cantidad, categoria } = req.body;

    const result = await pool.query(
      'UPDATE storage_principal SET nombre = $1, cantidad = $2, categoria = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [nombre, cantidad, categoria, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Producto no encontrado' });

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al editar producto' });
  }
});

app.delete('/api/storage-principal/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM storage_principal WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Producto no encontrado' });

    res.json({ message: 'Producto eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

/* ============================================
   ========= STORAGE SECUNDARIO ================
   ============================================ */

app.get('/api/storage-secundario', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM storage_secundario ORDER BY fecha_entrada DESC'
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

app.put('/api/storage-secundario/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, cantidad, categoria } = req.body;

    const result = await pool.query(
      'UPDATE storage_secundario SET nombre = $1, cantidad = $2, categoria = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [nombre, cantidad, categoria, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Producto no encontrado' });

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al editar producto' });
  }
});

app.delete('/api/storage-secundario/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM storage_secundario WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Producto no encontrado' });

    res.json({ message: 'Producto eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

/* ============================================
   =============== MEDICAMENTOS ================
   ============================================ */

app.get('/api/medicamentos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM medicamentos ORDER BY fecha_entrada DESC');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener medicamentos' });
  }
});

app.post(
  '/api/medicamentos',
  authMiddleware,
  [
    body('nombre').notEmpty(),
    body('cantidad').isInt({ min: 1 }),
    body('lote').notEmpty(),
    body('fecha_expiracion').isDate()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { nombre, cantidad, lote, fecha_expiracion } = req.body;

      const result = await pool.query(
        'INSERT INTO medicamentos (nombre, cantidad, lote, fecha_expiracion) VALUES ($1, $2, $3, $4) RETURNING *',
        [nombre, cantidad, lote, fecha_expiracion]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505')
        return res.status(400).json({ error: 'El lote ya existe' });

      res.status(500).json({ error: 'Error al agregar medicamento' });
    }
  }
);

app.put('/api/medicamentos/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, cantidad, lote, fecha_expiracion } = req.body;

    const result = await pool.query(
      'UPDATE medicamentos SET nombre = $1, cantidad = $2, lote = $3, fecha_expiracion = $4 WHERE id = $5 RETURNING *',
      [nombre, cantidad, lote, fecha_expiracion, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Medicamento no encontrado' });

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al editar medicamento' });
  }
});

app.delete('/api/medicamentos/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM medicamentos WHERE id = $1 RETURNING *', [
      id
    ]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Medicamento no encontrado' });

    res.json({ message: 'Medicamento eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar medicamento' });
  }
});

/* ============================================
   =============== RETIROS =====================
   ============================================ */

app.get('/api/retiros_medicamentos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM retiros_medicamentos ORDER BY fecha_retiro DESC'
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener retiros' });
  }
});

app.post(
  '/api/retiros_medicamentos',
  authMiddleware,
  [body('medicamento_id').isInt(), body('cantidad_retirada').isInt({ min: 1 }), body('nota').optional()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const client = await pool.connect();

    try {
      const { medicamento_id, cantidad_retirada, nota } = req.body;

      await client.query('BEGIN');

      const medQuery = await client.query('SELECT * FROM medicamentos WHERE id = $1', [
        medicamento_id
      ]);

      if (medQuery.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Medicamento no encontrado' });
      }

      const med = medQuery.rows[0];

      if (med.cantidad < cantidad_retirada) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cantidad insuficiente' });
      }

      const nuevaCantidad = med.cantidad - cantidad_retirada;

      await client.query('UPDATE medicamentos SET cantidad = $1 WHERE id = $2', [
        nuevaCantidad,
        medicamento_id
      ]);

      const result = await client.query(
        `INSERT INTO retiros_medicamentos 
        (medicamento_id, nombre_medicamento, lote, cantidad_retirada, nota)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [med.id, med.nombre, med.lote, cantidad_retirada, nota || null]
      );

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: 'Error al registrar retiro' });
    } finally {
      client.release();
    }
  }
);

/* ============================================
   =============== TRANSFERENCIAS ==============
   ============================================ */

app.get('/api/transferencias', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transferencias ORDER BY fecha_transferencia DESC'
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener transferencias' });
  }
});

/* ============================================
   =============== EXPORT CSV ==================
   ============================================ */

app.get('/api/export/principal', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM storage_principal ORDER BY nombre');

    let csv = 'Nombre,Cantidad,Categoría,Fecha Entrada\n';

    result.rows.forEach((row) => {
      csv += `${row.nombre},${row.cantidad},${row.categoria || ''},${new Date(
        row.fecha_entrada
      ).toLocaleString()}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=principal.csv');
    res.send(csv);
  } catch {
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

app.get('/api/export/secundario', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM storage_secundario ORDER BY nombre');

    let csv = 'Nombre,Cantidad,Categoría,Fecha Entrada\n';

    result.rows.forEach((row) => {
      csv += `${row.nombre},${row.cantidad},${row.categoria || ''},${new Date(
        row.fecha_entrada
      ).toLocaleString()}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=secundario.csv');
    res.send(csv);
  } catch {
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

/* ============================================
   =============== HEALTH CHECK ================
   ============================================ */

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

/* ============================================
   =============== INICIAR SERVER ==============
   ============================================ */

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

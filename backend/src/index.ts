import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import { pool } from "./db";
import { generateToken, authMiddleware, AuthRequest } from "./auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/* ============================================
   =============== LOGIN =======================
   ============================================ */

app.post(
  "/api/auth/login",
  [body("username").notEmpty(), body("password").notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { username, password } = req.body;

      const result = await pool.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);

      if (result.rows.length === 0)
        return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

      const user = result.rows[0];

      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword)
        return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

      const token = generateToken(user.id);
      res.json({ token, username: user.username });
    } catch (error) {
      res.status(500).json({ error: "Error del servidor" });
    }
  }
);

/* ============================================
   =============== REGISTER ====================
   ============================================ */

app.post(
  "/api/auth/register",
  [body("username").isLength({ min: 3 }), body("password").isLength({ min: 6 })],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { username, password } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
        [username, hashedPassword]
      );

      const token = generateToken(result.rows[0].id);
      res.status(201).json({ token, username: result.rows[0].username });
    } catch (error: any) {
      if (error.code === "23505") return res.status(400).json({ error: "Usuario ya existe" });
      res.status(500).json({ error: "Error del servidor" });
    }
  }
);

/* ============================================
   =============== AUTH ME =====================
   ============================================ */

app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query("SELECT id, username FROM users WHERE id = $1", [
      req.userId,
    ]);
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* ============================================
   ============ STORAGE PRINCIPAL ==============
   ============================================ */

app.get("/api/storage-principal", authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM storage_principal ORDER BY fecha_entrada DESC"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Error al obtener datos" });
  }
});

/* ============================================
   ============ AGREGAR PRINCIPAL ==============
   ============================================ */

app.post(
  "/api/storage-principal",
  authMiddleware,
  [body("nombre").notEmpty(), body("cantidad").isInt({ min: 1 }), body("categoria").optional()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { nombre, cantidad, categoria } = req.body;

      const existing = await pool.query(
        "SELECT * FROM storage_principal WHERE nombre = $1",
        [nombre]
      );

      if (existing.rows.length > 0) {
        const nueva = existing.rows[0].cantidad + cantidad;

        const result = await pool.query(
          "UPDATE storage_principal SET cantidad = $1, updated_at = CURRENT_TIMESTAMP WHERE nombre = $2 RETURNING *",
          [nueva, nombre]
        );

        return res.json({ message: "Cantidad actualizada", data: result.rows[0] });
      }

      const result = await pool.query(
        "INSERT INTO storage_principal (nombre, cantidad, categoria) VALUES ($1, $2, $3) RETURNING *",
        [nombre, cantidad, categoria]
      );

      res.status(201).json({ message: "Producto agregado", data: result.rows[0] });
    } catch {
      res.status(500).json({ error: "Error al agregar producto" });
    }
  }
);

/* ============================================
   ============ EDITAR PRINCIPAL ===============
   ============================================ */

app.put("/api/storage-principal/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, cantidad, categoria } = req.body;

    const result = await pool.query(
      "UPDATE storage_principal SET nombre = $1, cantidad = $2, categoria = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *",
      [nombre, cantidad, categoria, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Error al editar" });
  }
});

/* ============================================
   ============ ELIMINAR PRINCIPAL =============
   ============================================ */

app.delete("/api/storage-principal/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM storage_principal WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    res.json({ message: "Producto eliminado" });
  } catch {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

/* ============================================
   ============ STORAGE SECUNDARIO =============
   ============================================ */

app.get("/api/storage-secundario", authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM storage_secundario ORDER BY fecha_entrada DESC"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Error al obtener datos" });
  }
});

/* ============================================
   ============== MEDICAMENTOS =================
   ============================================ */

app.get("/api/medicamentos", authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM medicamentos ORDER BY fecha_entrada DESC");
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Error al obtener medicamentos" });
  }
});

/* ============================================
   ============ RETIROS MEDICAMENTOS ===========
   ============================================ */

app.get("/api/retiros_medicamentos", authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM retiros_medicamentos ORDER BY fecha_retiro DESC"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Error al obtener retiros" });
  }
});

/* ============================================
   ============ TRANSFERENCIA =================
   ============================================ */

app.post("/api/storage-principal/transfer", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, cantidad } = req.body;

    const principalResult = await pool.query("SELECT * FROM storage_principal WHERE id = $1", [id]);

    if (principalResult.rows.length === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    const producto = principalResult.rows[0];

    if (producto.cantidad < cantidad)
      return res.status(400).json({ error: "Cantidad insuficiente" });

    await pool.query("UPDATE storage_principal SET cantidad = cantidad - $1 WHERE id = $2", [
      cantidad, id,
    ]);

    const secundarioResult = await pool.query("SELECT * FROM storage_secundario WHERE nombre = $1", [
      producto.nombre,
    ]);

    if (secundarioResult.rows.length > 0) {
      await pool.query(
        "UPDATE storage_secundario SET cantidad = cantidad + $1 WHERE nombre = $2",
        [cantidad, producto.nombre]
      );
    } else {
      await pool.query(
        "INSERT INTO storage_secundario (nombre, cantidad, categoria) VALUES ($1, $2, $3)",
        [producto.nombre, cantidad, producto.categoria]
      );
    }

    await pool.query(
      "INSERT INTO transferencias (nombre_producto, cantidad, categoria) VALUES ($1, $2, $3)",
      [producto.nombre, cantidad, producto.categoria]
    );

    res.json({ message: "Transferencia realizada correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al realizar transferencia" });
  }
});

/* ============================================
   ============ GET TRANSFERENCIAS ============
   ============================================ */

app.get("/api/transferencias", authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM transferencias ORDER BY fecha_transferencia DESC");
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Error al obtener transferencias" });
  }
});

/* ============================================
   ============ AGREGAR MEDICAMENTO ============
   ============================================ */

app.post("/api/medicamentos", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { nombre, cantidad, lote, fecha_expiracion } = req.body;

    const result = await pool.query(
      "INSERT INTO medicamentos (nombre, cantidad, lote, fecha_expiracion) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre, cantidad, lote, fecha_expiracion]
    );

    res.status(201).json({ message: "Medicamento agregado", data: result.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar medicamento" });
  }
});



/* ============================================
   ======== POST RETIRO DE MEDICAMENTOS ========
   ============================================ */

app.post("/api/retiros_medicamentos", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { medicamento_id, cantidad_retirada, nota } = req.body;

    const medResult = await pool.query("SELECT * FROM medicamentos WHERE id = $1", [medicamento_id]);

    if (!medResult.rows.length)
      return res.status(404).json({ error: "Medicamento no encontrado" });

    const medicamento = medResult.rows[0];

    if (medicamento.cantidad < cantidad_retirada)
      return res.status(400).json({ error: "Cantidad insuficiente" });

    await pool.query(
      "UPDATE medicamentos SET cantidad = cantidad - $1 WHERE id = $2",
      [cantidad_retirada, medicamento_id]
    );

    await pool.query(
      "INSERT INTO retiros_medicamentos (medicamento_id, nombre_medicamento, lote, cantidad_retirada, nota) VALUES ($1, $2, $3, $4, $5)",
      [medicamento.id, medicamento.nombre, medicamento.lote, cantidad_retirada, nota]
    );

    res.json({ message: "Retiro registrado correctamente" });

  } catch {
    res.status(500).json({ error: "Error al registrar retiro" });
  }
});



/* ============================================
   ============ ALERTAS AUTOMÁTICAS ============
   ============================================ */

app.get("/api/alertas", authMiddleware, async (req: Request, res: Response) => {
  try {
    const hoy = new Date();
    const diasAviso = 30;
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + diasAviso);

    const result = await pool.query("SELECT * FROM medicamentos");

    const alertas = result.rows.map(med => {
      const expDate = new Date(med.fecha_expiracion);

      if (expDate < hoy)
        return { tipo: "expirado", mensaje: `⚠️ El medicamento ${med.nombre} lote ${med.lote} ya está vencido.` };

      if (expDate <= fechaLimite)
        return { tipo: "por_vencer", mensaje: `⏳ El medicamento ${med.nombre} lote ${med.lote} vence pronto (${med.fecha_expiracion}).` };

      if (med.cantidad < med.stock_minimo)
        return { tipo: "bajo_stock", mensaje: `📉 Stock bajo de ${med.nombre}. Quedan ${med.cantidad} y el mínimo es ${med.stock_minimo}.` };

      return null;
    }).filter(a => a !== null);

    res.json(alertas);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar alertas" });
  }
});


/* ============================================
   ============== HEALTH CHECK =================
   ============================================ */

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK" });
});

/* ============================================
   ============ INICIAR SERVIDOR ===============
   ============================================ */

app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});

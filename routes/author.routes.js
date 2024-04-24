const express = require("express");
const fs = require("fs");
const multer = require("multer");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/token");
const upload = multer({ dest: "public" });

// Modelos
const { Author } = require("../models/Author.js");
const { Book } = require("../models/Book.js");
const { isAuth } = require("../middlewares/auth.middleware.js");

// Router propio de Autores
const router = express.Router();

// CRUD: READ - devuelve todos los autores (params opcionales http://localhost:3000/author?page=1&limit=10)
router.get("/", async (req, res, next) => {
  try {
    // Asi leemos query params
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const author = await Author.find()
      .limit(limit)
      .skip((page - 1) * limit);

    // Num total de elementos
    const totalElements = await Author.countDocuments();

    const response = {
      totalItems: totalElements,
      totalPages: Math.ceil(totalElements / limit),
      currentPage: page,
      data: author,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// CRUD: CREATE - crea nuevo autor
router.post("/", async (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const author = new Author(req.body);
    const createdAuthor = await author.save();
    return res.status(201).json(createdAuthor);
  } catch (error) {
    next(error);
  }
});

// NO CRUD - Busca autor por nombre
router.get("/name/:name", async (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  const name = req.params.name;

  try {
    const author = await Author.find({ name: new RegExp("^" + name.toLowerCase(), "i") });

    if (author?.length) {
      res.json(author);
    } else {
      res.status(404).json([]);
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: UPDATE - modifica autor
router.put("/:id", isAuth, async (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const id = req.params.id;

    if (req.author.id !== id && req.author.email !== "admin@gmail.com") {
      return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    }

    const authorToUpdate = await Author.findById(id);
    if (authorToUpdate) {
      Object.assign(authorToUpdate, req.body);
      await authorToUpdate.save();
      // Quitamos pass de la respuesta
      const authorToSend = authorToUpdate.toObject();
      delete authorToSend.password;
      res.json(authorToSend);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: DELETE - Elimina autor
router.delete("/:id", isAuth, async (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const id = req.params.id;

    if (req.author.id !== id && req.author.email !== "admin@gmail.com") {
      return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    }

    const authorDeleted = await Author.findByIdAndDelete(id);
    if (authorDeleted) {
      res.json(authorDeleted);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

// CRUD: READ - busca autor por id
router.get("/:id", async (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const id = req.params.id;
    const author = await Author.findById(id).select("+password");

    if (author) {
      const temporalAuthor = author.toObject();
      const includeBooks = req.query.includeBooks === "true";
      if (includeBooks) {
        const books = await Book.find({ author: id });
        temporalAuthor.books = books;
      }

      res.json(temporalAuthor);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

router.post("/image-upload", upload.single("file"), async (req, res, next) => {
  try {
    // Renombrado de la imagen
    const originalname = req.file?.originalname;
    const path = req.file.path;
    const newPath = path + "_" + originalname;
    fs.renameSync(path, newPath);

    // Busqueda del autor
    const authorId = req.body.authorId;
    const author = await Author.findById(authorId);

    if (author) {
      author.profileImage = newPath;
      await author.save();
      res.json(author);

      console.log("Autor modificado correctamente!");
    } else {
      fs.unlinkSync(newPath);
      res.status(404).send("Autor no encontrado");
    }
  } catch (error) {
    next(error);
  }
});

// LOGIN DE AUTORES
router.post("/login", async (req, res, next) => {
  try {
    // const email = req.body.email;
    // const password = req.body.password;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Se deben especificar los campos email y password" });
    }

    const author = await Author.findOne({ email }).select("+password");
    if (!author) {
      // return res.status(404).json({ error: "No existe un usuario con ese email" });
      // Por seguridad mejor no indicar qué usuarios no existen
      return res.status(401).json({ error: "Email y/o contraseña incorrectos" });
    }

    // Comprueba la pass
    const match = await bcrypt.compare(password, author.password);
    if (match) {
      // Quitamos password de la respuesta
      const authorWithoutPass = author.toObject();
      delete authorWithoutPass.password;

      // Generamos token JWT
      const jwtToken = generateToken(author._id, author.email);

      return res.status(200).json({ token: jwtToken });
    } else {
      return res.status(401).json({ error: "Email y/o contraseña incorrectos" });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = { authorRouter: router };

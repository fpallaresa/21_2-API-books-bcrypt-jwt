const mongoose = require("mongoose");
const { connect } = require("../db.js");
const { Author } = require("../models/Author.js");

const authorSeed = async () => {
  try {
    await connect();
    console.log("Tenemos conexión");

    // Borrar datos
    await Author.collection.drop();
    console.log("Autores eliminados");

    const authorList = [
      { email: "gabriel@gmail.com", password: "12345678", name: "Gabriel G. Márquez", country: "Colombia" },
      { email: "jane@gmail.com", password: "12345678", name: "Jane Austen", country: "England" },
      { email: "leo@gmail.com", password: "12345678", name: "Leo Tolstoy", country: "Russia" },
      { email: "virginia@gmail.com", password: "12345678", name: "Virginia Woolf", country: "England" },
      { email: "ernest@gmail.com", password: "12345678", name: "Ernest Hemingway", country: "United States" },
      { email: "jorge@gmail.com", password: "12345678", name: "Jorge Luis Borges", country: "Argentina" },
      { email: "franz@gmail.com", password: "12345678", name: "Franz Kafka", country: "United States" },
      { email: "toni@gmail.com", password: "12345678", name: "Toni Morrison", country: "United States" },
      { email: "haruki@gmail.com", password: "12345678", name: "Haruki Murakami", country: "Japan" },
      { email: "chinua@gmail.com", password: "12345678", name: "Chinua Achebe", country: "United States" },
    ];

    const documents = authorList.map((author) => new Author(author));
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      await document.save();
    }

    console.log("Autores creados correctamente!");
  } catch (error) {
    console.error("ERROR AL CONECTAR CON LA BBDD");
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
};

authorSeed();

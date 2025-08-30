const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

let nonces = {};

app.get("/auth/nonce", (req, res) => {
  const { address } = req.query;
  const nonce = "Firma este mensaje: " + Math.floor(Math.random() * 1000000);
  nonces[address] = nonce;
  res.json({ nonce });
});

app.post("/auth/verify", (req, res) => {
  const { address, signature } = req.body;
  const nonce = nonces[address];
  const recovered = ethers.verifyMessage(nonce, signature);

  if (recovered.toLowerCase() === address.toLowerCase()) {
    const token = jwt.sign({ address }, "mi_secreto", { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Firma inválida" });
  }
});

app.post("/signature", (req, res) => {
  const { address, signatureImage } = req.body;
  console.log("Firma recibida de:", address);
  console.log("Imagen base64 (primeros 100 chars):", signatureImage.substring(0, 100));
  res.json({ success: true });
});

app.listen(3001, () => console.log("✅ Auth server en http://localhost:3001"));

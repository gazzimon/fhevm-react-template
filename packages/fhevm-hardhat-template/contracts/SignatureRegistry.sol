// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SignatureRegistry {
    struct Signature {
        address signer;      // Dirección de quien firmó
        uint256 timestamp;   // Momento de la firma (block.timestamp)
        string geo;          // Geolocalización (ej: "lat,long" o "Posadas, AR")
    }

    struct Document {
        string text;              // Texto o hash del contrato/documento
        address creator;          // Quién lo registró
        Signature[] signatures;   // Firmas asociadas
        mapping(address => bool) signed; // Lookup para evitar doble firma
    }

    mapping(bytes32 => Document) private documents;

    event DocumentRegistered(bytes32 indexed docHash, address indexed creator, string text);
    event DocumentSigned(bytes32 indexed docHash, address indexed signer, uint256 timestamp, string geo);

    /// @notice Registrar un nuevo documento
    /// @param text Texto completo o resumen del documento
    function registerDocument(string memory text) public returns (bytes32) {
        bytes32 docHash = keccak256(abi.encodePacked(text));
        Document storage doc = documents[docHash];
        require(doc.creator == address(0), "Document already registered");

        doc.text = text;
        doc.creator = msg.sender;

        emit DocumentRegistered(docHash, msg.sender, text);
        return docHash;
    }

    /// @notice Firmar un documento ya registrado
    /// @param docHash Hash del documento (devuelto al registrarlo)
    /// @param geo Geolocalizacion proporcionada por el front (ej: "lat,long")
    function signDocument(bytes32 docHash, string memory geo) public {
        Document storage doc = documents[docHash];
        require(doc.creator != address(0), "Document not found");
        require(!doc.signed[msg.sender], "Already signed");

        doc.signatures.push(Signature({
            signer: msg.sender,
            timestamp: block.timestamp,
            geo: geo
        }));

        doc.signed[msg.sender] = true;

        emit DocumentSigned(docHash, msg.sender, block.timestamp, geo);
    }

    /// @notice Obtener el texto y creador de un documento
    function getDocument(bytes32 docHash) public view returns (string memory, address) {
        Document storage doc = documents[docHash];
        require(doc.creator != address(0), "Document not found");
        return (doc.text, doc.creator);
    }

    /// @notice Obtener todas las firmas de un documento
    function getSignatures(bytes32 docHash) public view returns (Signature[] memory) {
        Document storage doc = documents[docHash];
        require(doc.creator != address(0), "Document not found");
        return doc.signatures;
    }
}

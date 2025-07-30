import { writeFileSync } from 'fs';  
import fetch from 'node-fetch';     

const sheetId = '1isxm--VXfLg8vW0DVwG2NadyleKL2LpR2AuaMiXVVkQ';
const apiKey = "AIzaSyAakhDkdarEtaPKAgJI5n_268JQeOzLn_I";

const range = 'final!A:U'; 
const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    const rows = data.values;  // `values` contient les lignes de la feuille (toutes les lignes)

    const products = rows.map(row => ({
      sku: row[0],              // Correspond à la colonne A (sku)
      nom: row[1],              // Correspond à la colonne B (nom)
      effets: row[2],           // Correspond à la colonne C (effets)
      poids: row[3],            // Correspond à la colonne D (poids)
      vertus: row[4],           // Correspond à la colonne E (vertus)
      composition: row[5],      // Correspond à la colonne F (composition)
      utilisation: row[6],      // Correspond à la colonne G (utilisation)
      prix: row[7] ? row[7] : null,  // Condition pour afficher le prix (colonne H)
      codebarre: row[8],        // Correspond à la colonne I (codebarre)
      nomchinois: row[9],       // Correspond à la colonne J (nom chinois)
      couleur: row[10],         // Correspond à la colonne K (couleur)
      bio: row[11],             // Correspond à la colonne L (bio)
      brand: row[12],           // Correspond à la colonne M (brand)
      lot: row[13],             // Correspond à la colonne N (lot)
      icon: row[14],            // Correspond à la colonne O (icon)
      id: row[15]             // Correspond à la colonne P (id)

    }));

    // Sauvegarder les données dans un fichier JSON
    const destinationFile = './dossier/data.json'; // Le fichier de destination où vous voulez sauvegarder les données, renommé le fichier de destination pour ne pas remplacer celui déjà existant !!!!!! 

    writeFileSync(destinationFile, JSON.stringify(products, null, 2));  // Sauvegarde en json

    console.log(`Les données ont été dupliquées dans "${destinationFile}"`); 
  })
  .catch(error => {
    console.error('Erreur lors de la récupération des données:', error);
  });
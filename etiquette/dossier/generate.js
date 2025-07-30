import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import readline from 'readline';

// Fonction pour demander une entrée dans le terminal
const askQuestion = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => rl.question(query, answer => {
        rl.close();
        resolve(answer);
    }));
};

// Charger les données JSON
const products = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Fonction pour convertir pixels → millimètres
const pxToMm = (px) => (px * 25.4) / 96;

const cleanFileName = (name) => {
    return name
        .replace(/<\/?[^>]+(>|$)/g, "")  // Supprime les balises HTML si présentes
        .replace(/[^\p{L}\p{N}\p{Script=Han}_-]/gu, "_") // Garde toutes les lettres, chiffres et caractères chinois
        .trim();
};


// Fonction principale
(async () => {
    console.log("📢 Bienvenue dans le générateur d'étiquettes 📢");

    // Demande ID Min et ID Max à l'utilisateur
    const idMin = parseInt(await askQuestion("🔹 Entrez l'ID MIN : "), 10);
    const idMax = parseInt(await askQuestion("🔹 Entrez l'ID MAX : "), 10);

    // Vérification des entrées utilisateur
    if (isNaN(idMin) || isNaN(idMax) || idMin > idMax) {
        console.error("❌ Erreur : Vous devez entrer des nombres valides !");
        process.exit(1);
    }

    console.log(`📢 Génération des étiquettes pour les produits entre ID ${idMin} et ${idMax}...\n`);

    // Filtrer les produits en fonction des IDs fournis
    const filteredProducts = products.filter(product => product.id >= idMin && product.id <= idMax);

    if (filteredProducts.length === 0) {
        console.error("❌ Aucun produit trouvé dans cette plage d'ID.");
        process.exit(1);
    }

    console.log(`✅ ${filteredProducts.length} produit(s) sélectionné(s) !\n`);

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Charger le modèle HTML en local
    const templatePath = path.join(process.cwd(), 'text.html');
    let templateHtml = fs.readFileSync(templatePath, 'utf8');

    for (const product of filteredProducts) {
        // Remplacement des placeholders dans le HTML
            let htmlContent = templateHtml
            .replace(/{{ product\['lot'\] }}/g, product.lot)
            .replace(/{{ product\['prix'\] }}/g, product.prix)
            .replace(/{{ product\['codebarre'\] }}/g, product.codebarre)
            .replace(/{{ product\['couleur'\] }}/g, product.couleur)
            .replace(/{{ product\['nom'\] }}/g, product.nom)
            .replace(/{{ product\['effets'\] }}/g, product.effets)
            .replace(/{{ product\['poids'\] }}/g, product.poids)
            .replace(/{{ product\['bio'\] }}/g, product.bio)
            .replace(/{{ product\['icon'\] }}/g, product.icon)
            .replace(/{{ product\['utilisation'\] }}/g, product.utilisation)
            .replace(/{{ product\['vertus'\] }}/g, product.vertus)
            .replace(/{{ product\['brand'\] }}/g, product.brand)
            .replace(/{{ product\['composition'\] }}/g, product.composition)
            .replace(/{{ product\['nomchinois'\] }}/g, product.nomchinois);
            console.log("🎯 nomchinois =", product.nomchinois); 

        console.log(`🎯 Génération pour produit : ${product.nom} (${product.nomchinois})`);

        // Charger le HTML modifié dans Puppeteer
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Attendre que `.section` soit bien rendue
        await page.waitForSelector('.section');

        // Vérifier si `.section` existe bien
        const sectionExists = await page.evaluate(() => !!document.querySelector('.section'));
        if (!sectionExists) {
            console.error("❌ Erreur : L'élément `.section` n'a pas été trouvé !");
            continue;
        }

        // Récupérer la taille réelle de l'étiquette `.section`
        const sectionSize = await page.evaluate(() => {
            const section = document.querySelector('.section');
            return {
                width: section.offsetWidth,
                height: section.offsetHeight
            };
        });


        // Convertir les dimensions en millimètres
        const pdfWidth = pxToMm(sectionSize.width);
        const pdfHeight = pxToMm(sectionSize.height);

        console.log(`📏 Taille détectée : ${sectionSize.width}px x ${sectionSize.height}px 
                     → ${pdfWidth.toFixed(2)}mm x ${pdfHeight.toFixed(2)}mm`);

        // Générer un fichier PDF
        const date = new Date().toISOString().split('T')[0]; // Récupère la date au format YYYY-MM-DD

        const hasChineseName = product.nomchinois && product.nomchinois.trim() !== "";

        const fileName = hasChineseName
        ? `${cleanFileName(product.nomchinois)}-${cleanFileName(product.nom)}-无价-${cleanFileName(product.poids)}-${cleanFileName(product.sku)}-${date}.pdf`
        : `${cleanFileName(product.nom)}-无价-${cleanFileName(product.poids)}-${cleanFileName(product.sku)}-${date}.pdf`;
        await page.pdf({ 
            path: fileName, 
            width: `${pdfWidth}mm`, 
            height: `${pdfHeight}mm`, 
            printBackground: true
        });

        console.log(`📄 Étiquette générée : ${fileName}`);
    }

    await browser.close();

    // Générer un ZIP avec toutes les étiquettes
    const output = fs.createWriteStream('etiquettes.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => console.log(`📦 Fichier ZIP créé : ${archive.pointer()} octets`));

    archive.pipe(output);
    fs.readdirSync('.').forEach(file => {
        if (file.endsWith('.pdf')) archive.file(file, { name: file });
    });

    archive.finalize();

    console.log("✅ Tout est terminé ! Votre fichier ZIP est prêt.");
})();

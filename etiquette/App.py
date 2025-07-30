from flask import Flask, render_template, send_file, abort, jsonify
import json

app = Flask(__name__)

# Charger les données depuis le fichier JSON
with open('data.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

@app.route('/', methods=['GET'])
def show_all_products():
    return jsonify(products)

@app.route('/api/etiquette/<sku>', methods=['GET'])
def show_sku_label(sku):
    # Log pour vérifier la requête SKU
    print(f"Requête reçue pour SKU: {sku}")

    # Chercher le produit par SKU en ignorant la casse
    product = next((p for p in products if p['sku'].strip().upper() == sku.strip().upper()), None)

    if product is None:
        print(f"Produit non trouvé pour SKU: {sku}")
        return abort(404, description="Produit non trouvé")

    print(f"Produit trouvé: {product['sku']}")

    return render_template('text.html', products=[product], generate_date=generate_date)

# Fonction pour générer la date au format MM/YYYY
def generate_date():
    from datetime import datetime
    future_year = datetime.now().year + 3
    return f"{datetime.now().month:02}/{future_year}"

if __name__ == '__main__':
    app.run(debug=True)

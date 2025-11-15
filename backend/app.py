from flask import Flask, jsonify
from flask_cors import CORS
from helpers import race_results

app = Flask(__name__)
CORS(app)



def getting_results():
  session_results = race_results()
  return jsonify(session_results)

@app.route('/')
def hello_api():
    return getting_results()


if __name__ == "__main__":
    app.run(port=5000, debug=True)
from threaddit import app

if __name__ == "__main__":
    # Local development server (Azure will NOT use this)
    app.run(host="0.0.0.0", port=5000, debug=False)

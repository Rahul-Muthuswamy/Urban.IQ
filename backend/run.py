from threaddit import app

if __name__ == "__main__":
    # Run on localhost to match frontend origin (localhost:5173)
    # This prevents Chrome from blocking cookies due to origin mismatch
    app.run(host='localhost', port=5000, debug=True)

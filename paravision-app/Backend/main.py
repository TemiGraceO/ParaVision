from fastapi import FastAPI
app = FastAPI()  # Missing this?
@app.get("/")
def root():
      return {"message": "👋 Backend alive!"}
def debuter():
    global somme, compteur
    somme = 0
    compteur = 0
def ajouter(x):
    global somme, compteur
    somme += x
    compteur += 1
def moyenne():
    return somme / compteur
debuter()
ajouter(100)
ajouter(200)
print(moyenne())
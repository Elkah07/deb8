# Deb8 V33 — clic « Régler la partie »

La V32 a bien supprimé les erreurs rouges du Service Worker : la capture reçue
confirme que cette partie est réglée.

Le blocage restant est maintenant isolé au clic du bouton.

V33 ajoute un gestionnaire JavaScript EXTERNE chargé en dernier qui intercepte
le clic/pointer au niveau du document en phase capture. Il ne dépend ni du
`data-oc`, ni d'un `onclick` HTML, ni d'un éventuel élément superposé.

À remplacer/ajouter :
- index.html (remplacer)
- service-worker.js (remplacer)
- js/02-core-state-navigation.js (remplacer)
- js/14-theme-button-bridge.js (ajouter)

Test :
Après déploiement + Ctrl+F5, cliquer « Régler la partie ».
La console doit afficher :
`Deb8 V33 : clic Régler la partie détecté`

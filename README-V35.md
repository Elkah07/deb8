# Deb8 V35 — reconstruction complète depuis deb8-main(3).zip

Cette version repart du dernier dépôt complet fourni, et non de V34.

Le parcours d'origine est conservé :
1. Un seul téléphone
2. Nombre de joueurs
3. Noms des joueurs
4. Choix du mode
5. Règles
6. Choix des thèmes
7. Réglages
8. Lancement de la partie

Seuls le passage Thèmes -> Réglages, la conservation du mode et le Service Worker ont été sécurisés.

Tests exécutés :
- syntaxe de tous les JavaScript : OK
- JSON : OK
- présence du flux Un seul téléphone -> Noms : OK
- Noms -> Mode : OK
- Mode -> Règles : OK
- Règles -> Thèmes : OK
- Thèmes -> Réglages : OK
- écrans s5 et s9 présents : OK

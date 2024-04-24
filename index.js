const express = require("express");
const cors = require("cors");
const app = express();
const port = 443;

// Autoriser uniquement une ou plusieurs origines spécifiques
app.use(
  cors({
    origin: function (origin, callback) {
      // Autoriser toutes les origines sauf si le 'origin' est indéterminé (en développement)
      if (!origin) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true, // Pour autoriser les cookies/identifiants
  })
);
app.use(express.json()); // Nécessaire pour obtenir `req.body` comme JSON

app.get("/get-data", (req, res) => { res.json({"test": "test"})});
  

app.post("/get-data", (req, res) => {
  const { email, password } = req.body;

  fetch("https://overbookd.24heures.org/api/login", {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/json;charset=UTF-8",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    },
    referrer: "https://overbookd.24heures.org/login",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: '{"email":"' + email + '","password":"' + password + '"}',
    method: "POST",
    mode: "cors",
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.accessToken) {
        const query = "https://overbookd.24heures.org/api/transactions/me";

        const headers = {
          "sec-ch-ua":
            '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          Accept: "application/json, text/plain, */*",
          Referer: "https://overbookd.24heures.org/my-personal-account",
          Authorization: `Bearer ${data.accessToken}`,
        };
        fetch(query, {
          method: "GET",
          headers: headers,
        })
          .then((response) => response.json())
          .then((data) => {
            let amountSpent = [];
            let barrelAmount = [];
            let barrelNumber = [];
            let provisionAmount = [];
            let provisionNumber = [];
            let transfertInAmount = [];
            let transfertOutAmount = [];
            let sharedMealAmount = [];
            let sharedMealNumber = 0;

            data.forEach((transaction) => {
              if (transaction.type === "DEPOSIT") {
                amountSpent.push(transaction.amount);
              }
              if (transaction.type === "BARREL") {
                barrelAmount.push(transaction.amount);
                barrelNumber.push(
                  parseInt(
                    transaction.context.replace("  ", " ").split(" ")[4],
                    10
                  )
                );
              }
              if (transaction.type === "PROVISIONS") {
                provisionAmount.push(transaction.amount);
                provisionNumber.push(
                  parseInt(
                    transaction.context.replace("  ", " ").split(" ")[2],
                    10
                  )
                );
              }
              if (transaction.type === "TRANSFER") {
                if ("from" in transaction) {
                  transfertInAmount.push(transaction.amount);
                } else {
                  transfertOutAmount.push(transaction.amount);
                }
              }
              if (transaction.type === "SHARED_MEAL") {
                sharedMealAmount.push(transaction.amount);
                sharedMealNumber += 1;
              }
            });

            const totalAmountSpent = amountSpent.reduce((a, b) => a + b, 0);
            const totalBarrelAmount = barrelAmount.reduce((a, b) => a + b, 0);
            const totalProvisionAmount = provisionAmount.reduce(
              (a, b) => a + b,
              0
            );
            const totalTransfertInAmount = transfertInAmount.reduce(
              (a, b) => a + b,
              0
            );
            const totalTransfertOutAmount = transfertOutAmount.reduce(
              (a, b) => a + b,
              0
            );
            const totalSharedMealAmount = sharedMealAmount.reduce(
              (a, b) => a + b,
              0
            );
            const totalBarrelNumber = barrelNumber.reduce((a, b) => a + b, 0);
            const totalProvisionNumber = provisionNumber.reduce(
              (a, b) => a + b,
              0
            );

            console.log(
              "account:",
              email,
              "totalAmountSpent:",
              totalAmountSpent,
              "totalBarrelAmount:",
              totalBarrelAmount,
              "totalProvisionAmount:",
              totalProvisionAmount,
              "totalTransfertInAmount:",
              totalTransfertInAmount,
              "totalTransfertOutAmount:",
              totalTransfertOutAmount,
              "totalSharedMealAmount:",
              totalSharedMealAmount,
              "sharedMealNumber:",
              sharedMealNumber,
              "barrelNumber:",
              totalBarrelNumber,
              "provisionNumber:",
              totalProvisionNumber
            );

            res.json({
              totalAmountSpent,
              totalBarrelAmount,
              totalProvisionAmount,
              totalTransfertInAmount,
              totalTransfertOutAmount,
              totalSharedMealAmount,
              sharedMealNumber,
              totalBarrelNumber,
              totalProvisionNumber,
            });
          })
          .catch((error) => {
            console.error("Erreur lors du chargement des transactions:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la connexion:", error);
    });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});

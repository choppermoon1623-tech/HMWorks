const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const history = [1];

const diceElement = document.getElementById("dice");
const resultElement = document.getElementById("result");
const historyElement = document.getElementById("history");
const rollButton = document.getElementById("rollButton");

function rollDice() {
  const value = Math.floor(Math.random() * 6) + 1;
  diceElement.textContent = diceFaces[value - 1];
  diceElement.setAttribute("aria-label", `サイコロの目は${value}`);

  resultElement.textContent = `現在の目: ${value}`;

  history.push(value);
  const recentHistory = history.slice(-10).join(" → ");
  historyElement.textContent = `履歴: ${recentHistory}`;
}

rollButton.addEventListener("click", rollDice);

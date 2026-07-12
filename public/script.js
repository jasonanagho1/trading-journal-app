let equityChart = null;
let trades = JSON.parse(localStorage.getItem("trades")) || [];
let editingTradeId = null;
let currentDirectionFilter = "all";
let currentTagFilter = "all";
let currentStartDate = "";
let currentEndDate = "";
let currentMinProfit = "";
let currentMaxProfit = "";
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const form = document.getElementById("tradeForm");
const tradesDiv = document.getElementById("trades");
const tagCheckboxes = document.querySelectorAll('input[name="tags"]');
const exportCsvBtn = document.getElementById("exportCsvBtn");

function saveTrades() {
    localStorage.setItem("trades", JSON.stringify(trades));
}

function displayTrade(trade) {

    const profitLossNumber = Number(trade.profitLoss);

    let cardClass = "trade-card";

    if (profitLossNumber > 0) {
        cardClass += " profit";
    }else if (profitLossNumber < 0) {
        cardClass += " loss";
    }

    tradesDiv.innerHTML += `
        <div class="${cardClass}">
            <p><strong>Pair:</strong> ${trade.pair}</p>
            <p><strong>Direction:</strong> ${trade.direction}</p>
            <p><strong>Profit/Loss:</strong> ${trade.profitLoss}</p>

            <button class="details-btn">
                View Details
            </button>

            <div class="details hidden">
                <p><strong>Date:</strong> ${new Date(trade.date).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit"
                })}</p>

                <p><strong>Risk:</strong> ${trade.risk}</p>
                <p><strong>Risk to Reward:</strong> ${
                    trade.risk ? (Number(trade.profitLoss) / Number(trade.risk)).toFixed(2) : "N/A"
                }</p>
                <p><strong>Notes:</strong> ${trade.notes}</p>
                <p><strong>Tags:</strong> ${trade.tags && trade.tags.length > 0 ? trade.tags.join(", ") : "None"}</p>

            </div>


            <div class="trade-actions">
                <button class="delete-btn" onclick="deleteTrade(${trade.id})">
                    Delete
                </button>

                <button class="edit-btn" onclick="editTrade(${trade.id})">
                    Edit
                </button>
            </div>
        </div>
    `;
}

function setupDetailsButtons() {
    const detailButtons = document.querySelectorAll(".details-btn");

    detailButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            const detailsDiv = button.nextElementSibling;

            if (detailsDiv.classList.contains("hidden")) {
                detailsDiv.classList.remove("hidden");
                button.textContent = "Hide Details";
            } else {
                detailsDiv.classList.add("hidden");
                button.textContent = "View Details";
            }
        });
    });
}

function checkEmptyMessage(tradesToDisplay) {
  const emptyMessage = document.getElementById("emptyMessage");

  if (tradesToDisplay.length === 0) {
    emptyMessage.style.display = "block";
  } else {
    emptyMessage.style.display = "none";
  }
}

function displayTrades(tradesToDisplay) {
    tradesDiv.innerHTML = "";
 
    tradesToDisplay.forEach((trade) => {
        displayTrade(trade);
    });

    checkEmptyMessage(tradesToDisplay);
}

function loadTrades() {
    trades = JSON.parse(localStorage.getItem("trades")) || [];
    trades.sort(function(a, b) {
        return b.id - a.id;
    });
    let filteredTrades = trades;
    updateStats();

    if (currentDirectionFilter !== "all") {
         filteredTrades = filteredTrades.filter(function (trade) {
            return trade.direction === currentDirectionFilter;
        });
    }

    if (currentTagFilter !== "all") {
        filteredTrades = filteredTrades.filter(function(trade) {
            return trade.tags && trade.tags.includes(currentTagFilter);
    });
    }

    if (currentStartDate !== "" && currentEndDate !== "") {
        filteredTrades = filteredTrades.filter(function(trade) {
            const tradeDate = new Date(trade.date);
            const startDate = new Date(currentStartDate);
            const endDate = new Date(currentEndDate);

            return tradeDate >= startDate && tradeDate <= endDate;
        });
    }

    if (currentMinProfit !== "" && currentMaxProfit !== "") {
        filteredTrades = filteredTrades.filter(function(trade) {
            const profitLoss = Number(trade.profitLoss);

            return profitLoss >= Number(currentMinProfit) &&
               profitLoss <= Number(currentMaxProfit);
        });
    }

    const emptyMessage = document.getElementById("emptyMessage");
    if (trades.length === 0) {
        emptyMessage.style.display = "block";
    } else {
        emptyMessage.style.display = "none";
    }

    

    tradesDiv.innerHTML = "";

    displayTrades(filteredTrades);
    updateStats(trades);
    updateEquityChart(trades);
    calculatePairStats(trades);
    calculateDirectionStats(trades);
    calculateMostTradedPair(trades);
    calculateMonthlyStats(trades);
    setupDetailsButtons();
    calculateTagComparison();
    renderCalendar(trades);
}

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const pair = document.getElementById("pair").value;
    const direction = document.getElementById("direction").value;
    const profitLoss = document.getElementById("profitLoss").value;
    const risk = document.getElementById("risk").value;
    const notes = document.getElementById("notes").value;
    const date = new Date().toISOString();

    const selectedTags = [];

    tagCheckboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            selectedTags.push(checkbox.value);
        }
    });

    if (editingTradeId === null) {
        const newTrade = {
            id: Date.now(),
            date: date,
            pair: pair,
            direction: direction,
            profitLoss: Number(profitLoss),
            risk: Number(risk),
            notes: notes,
            tags: selectedTags,
        };

        trades.push(newTrade);
    } else {
        const tradeIndex = trades.findIndex(function(trade) {
            return trade.id === editingTradeId;
        });

        if (tradeIndex !== -1) {
            trades[tradeIndex] = {
                ...trades[tradeIndex],
                pair: pair,
                direction: direction,
                profitLoss: Number(profitLoss),
                risk: Number(risk),
                notes: notes,
                tags: selectedTags,
            };
        }

        editingTradeId = null;
    }

    saveTrades();
    form.reset();
    loadTrades();
});



function deleteTrade(id) {
    trades = trades.filter(function(trade) {
        return trade.id !== id;
    });

    saveTrades();
    loadTrades();
    
}

function editTrade(id) {
    const trade = trades.find((trade) => trade.id === id);

    document.getElementById("pair").value = trade.pair;
    document.getElementById("direction").value = trade.direction;
    document.getElementById("profitLoss").value = trade.profitLoss;
    document.getElementById("risk").value = trade.risk;
    document.getElementById("notes").value = trade.notes;
    tagCheckboxes.forEach((checkbox) => {
        checkbox.checked = false;
    });

    if (trade.tags){
        tagCheckboxes.forEach((checkbox) => {
            if (trade.tags.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
    }

    

    editingTradeId = id;
}
loadTrades();


function filterTrades(filterType) {
    document.getElementById("searchInput").value = "";
    
    tradesDiv.innerHTML = "";

    let filteredTrades = trades;

    if(filterType === "wins"){
        filteredTrades = trades.filter((trade) => Number(trade.profitLoss) > 0);
    } else if(filterType === "losses"){
        filteredTrades = trades.filter((trade) => Number(trade.profitLoss) < 0);
    }

    displayTrades(filteredTrades);
    setupDetailsButtons();
}

function searchTrades() {
    const searchValue = document.getElementById("searchInput").value.toLowerCase();

    tradesDiv.innerHTML = "";

    const searchedTrades = trades.filter((trade) => {
        return trade.pair.toLowerCase().includes(searchValue);
    });

    displayTrades(searchedTrades);
    setupDetailsButtons();
}

document.getElementById("allDirectionBtn").addEventListener("click", function () {
    currentDirectionFilter = "all";
    setActiveDirectionButton(this);
    loadTrades();
});

document.getElementById("buyDirectionBtn").addEventListener("click", function () {
    currentDirectionFilter = "Buy";
    setActiveDirectionButton(this);
    loadTrades();
});

document.getElementById("sellDirectionBtn").addEventListener("click", function () {
    currentDirectionFilter = "Sell";
    setActiveDirectionButton(this);
    loadTrades();
});

document.getElementById("tagFilter").addEventListener("change", function() {
    currentTagFilter = this.value;
    loadTrades();
});

document.getElementById("startDate").addEventListener("change", function() {
    currentStartDate = this.value;
    loadTrades();
});

document.getElementById("endDate").addEventListener("change", function() {
    currentEndDate = this.value;
    loadTrades();
});

document.getElementById("minProfit").addEventListener("input", function() {
    currentMinProfit = this.value;
    loadTrades();
});

document.getElementById("maxProfit").addEventListener("input", function() {
    currentMaxProfit = this.value;
    loadTrades();
});

function updateStats(){
    let totalTrades = trades.length;
    let totalProfitLoss = 0;
    let wins = 0;
    let losses = 0;
    let bestTrade = 0;
    let worstTrade = 0;

    let currentWinStreak = 0;
    let biggestWinStreak = 0;
    let currentLossStreak = 0;
    let biggestLossStreak = 0;

    let profitFactor = 0;

    let aPlusCount = 0;
    let aPlusProfit = 0;

    let revengeCount = 0;
    let revengeProfit = 0;

    let newsCount = 0;
    let newsProfit = 0;

    let badEntryCount = 0;
    let badEntryProfit = 0;

    let disciplineCount = 0;
    let disciplineProfit = 0;

    let aPlusWins = 0;
    let revengeWins = 0;
    let newsWins = 0;
    let badEntryWins = 0;
    let disciplineWins = 0;

    let aPlusTotalR = 0;
    let revengeTotalR = 0;
    let newsTotalR = 0;
    let badEntryTotalR = 0;
    let disciplineTotalR = 0;

    let totalR = 0;
    let rTradeCount = 0;
    let bestR = -Infinity;

    

    const weekdayStats = {
        Sunday: { count: 0, profit: 0 },
        Monday: { count: 0, profit: 0 },
        Tuesday: { count: 0, profit: 0 },
        Wednesday: { count: 0, profit: 0 },
        Thursday: { count: 0, profit: 0 },
        Friday: { count: 0, profit: 0 },
        Saturday: { count: 0, profit: 0 }
  };

    trades.forEach(function(trade) {
        const date = new Date(trade.date);
        const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
        const profitLoss = Number(trade.profitLoss);

        weekdayStats[weekday].count++;
        weekdayStats[weekday].profit += profitLoss;
    });

    let bestWeekday = "";
    let bestProfit = -Infinity;

    let worstWeekday = "";
    let worstProfit = Infinity;

    for (let day in weekdayStats) {
        if (weekdayStats[day].count > 0) {
            if (weekdayStats[day].profit > bestProfit) {
                bestProfit = weekdayStats[day].profit;
                bestWeekday = day;
            }
            if (weekdayStats[day].profit < worstProfit) {
                worstProfit = weekdayStats[day].profit;
                worstWeekday = day;
            }
        }

    }

    if(trades.length > 0){
        bestTrade = Number(trades[0].profitLoss);
        worstTrade = Number(trades[0].profitLoss);
    }
    let winnerTotal = 0;
    let loserTotal = 0;
    let winnerRR = 0;

    trades.forEach((trade) => {
        const profitLossNumber = Number(trade.profitLoss);

        if(profitLossNumber > 0) {
            winnerRR += trade.risk ? (profitLossNumber / Number(trade.risk)) : 0;
        }

        if (profitLossNumber > bestTrade) {
            bestTrade = profitLossNumber;
        }

        if (profitLossNumber < worstTrade) {
            worstTrade = profitLossNumber;
        }

        totalProfitLoss += profitLossNumber;

        if (profitLossNumber > 0) {
            currentWinStreak++;

        if (currentWinStreak > biggestWinStreak) {
            biggestWinStreak = currentWinStreak;
        }
        } else {
            currentWinStreak = 0;
        }

        if (profitLossNumber < 0) {
            currentLossStreak++;
            if (currentLossStreak > biggestLossStreak) {
                biggestLossStreak = currentLossStreak;
            }
        } else {
            currentLossStreak = 0;
        }    

        if (profitLossNumber > 0) {
            wins++;
            winnerTotal += profitLossNumber;
        } else if (profitLossNumber < 0) {
            losses++;
            loserTotal += profitLossNumber;
        }

        if (loserTotal !== 0) {
            profitFactor = winnerTotal / Math.abs(loserTotal);
        }

        if (trade.tags && trade.tags.includes("A+ Setup")) {
            aPlusCount++;
            aPlusProfit += profitLossNumber;

            if(profitLossNumber > 0) {
                aPlusWins++;
            }

            if(trade.risk){
                aPlusTotalR += Number(trade.profitLoss) / Number(trade.risk);
            }
        }

        if (trade.tags && trade.tags.includes("Revenge Trade")) {
            revengeCount++;
            revengeProfit += profitLossNumber;

            if(profitLossNumber > 0) {
                revengeWins++;
            }

            if(trade.risk){
                revengeTotalR += Number(trade.profitLoss) / Number(trade.risk);
            }
        }

        if (trade.tags && trade.tags.includes("News Trade")) {
            newsCount++;
            newsProfit += profitLossNumber;

            if(profitLossNumber > 0) {
                newsWins++;
            }

            if(trade.risk){
                newsTotalR += Number(trade.profitLoss) / Number(trade.risk);
            }
        }

        if (trade.tags && trade.tags.includes("Bad Entry")) {
            badEntryCount++;
            badEntryProfit += profitLossNumber;

            if(profitLossNumber > 0) {
                badEntryWins++;
            }

            if(trade.risk){
                badEntryTotalR += Number(trade.profitLoss) / Number(trade.risk);
            }
        }

        if (trade.tags &&  trade.tags.includes("Good Discipline")) {
            disciplineCount++;
            disciplineProfit += profitLossNumber;

            if(profitLossNumber > 0) {
                disciplineWins++;
            }

            if(trade.risk){
                disciplineTotalR += Number(trade.profitLoss) / Number(trade.risk);
            }
        }

        if (trade.risk) {
            totalR += Number(trade.profitLoss) / Number(trade.risk);
            rTradeCount++;
        }

        if (trade.risk) {
            const currentR =
                Number(trade.profitLoss) / Number(trade.risk);

            if (currentR > bestR) {
                bestR = currentR;
            }
        }

    });

    const avgWinRR = winnerRR / wins;

    const averageR = rTradeCount > 0 ? (totalR/rTradeCount).toFixed(2) : 0;

    const aPlusWinRate =
        aPlusCount > 0
            ? ((aPlusWins / aPlusCount) * 100).toFixed(2)
            : 0;

    const revengeWinRate =
        revengeCount > 0
            ? ((revengeWins / revengeCount) * 100).toFixed(2)
            : 0;

    const newsWinRate =
        newsCount > 0
            ? ((newsWins / newsCount) * 100).toFixed(2)
            : 0;

    const badEntryWinRate =
        badEntryCount > 0
            ? ((badEntryWins / badEntryCount) * 100).toFixed(2)
            : 0;

    const disciplineWinRate =
        disciplineCount > 0
            ? ((disciplineWins / disciplineCount) * 100).toFixed(2)
            : 0;


    const aPlusAvgR =
        aPlusCount > 0 ? (aPlusTotalR / aPlusCount).toFixed(2) : 0;

    const revengeAvgR =
        revengeCount > 0 ? (revengeTotalR / revengeCount).toFixed(2) : 0;

    const newsAvgR =
        newsCount > 0 ? (newsTotalR / newsCount).toFixed(2) : 0;

    const badEntryAvgR =
        badEntryCount > 0 ? (badEntryTotalR / badEntryCount).toFixed(2) : 0;

    const disciplineAvgR =
        disciplineCount > 0 ? (disciplineTotalR / disciplineCount).toFixed(2) : 0;        

    let winRate = 0;
    if (totalTrades > 0) {
        winRate = (wins / totalTrades) * 100;
    }

    let averageTrade = 0;
    let averageWinner = 0;
    let averageLoser = 0;

    if (totalTrades > 0) {
        averageTrade = totalProfitLoss / totalTrades;
    }

    if (wins > 0) {
        averageWinner = winnerTotal / wins;
    }

    if (losses > 0) {
        averageLoser = loserTotal / losses;
    }

    /*Tag Comparison*/



    /*html stats*/
    document.getElementById("totalTrades").textContent = totalTrades;
    document.getElementById("totalProfitLoss").textContent = `${totalProfitLoss.toFixed(2)}`;
    document.getElementById("wins").textContent = wins;
    document.getElementById("losses").textContent = losses;
    document.getElementById("winRate").textContent = `${winRate.toFixed(1)}`;

    document.getElementById("averageTrade").textContent = averageTrade.toFixed(2);
    document.getElementById("bestTrade").textContent = bestTrade.toFixed(2);
    document.getElementById("worstTrade").textContent = worstTrade.toFixed(2);
    document.getElementById("averageWinner").textContent = averageWinner.toFixed(2);
    document.getElementById("averageLoser").textContent = averageLoser.toFixed(2);
    document.getElementById("biggestWinStreak").textContent = biggestWinStreak;
    document.getElementById("biggestLossStreak").textContent = biggestLossStreak;
    document.getElementById("profitFactor").textContent = profitFactor.toFixed(2);

    document.getElementById("aPlusStats").textContent =
        `${aPlusCount} Trades | $${aPlusProfit} | ${aPlusWinRate}% WR | ${aPlusAvgR}R Avg`;

    document.getElementById("revengeStats").textContent =
        `${revengeCount} Trades | $${revengeProfit} | ${revengeWinRate}% WR | ${revengeAvgR}R Avg`;

    document.getElementById("newsStats").textContent =
        `${newsCount} Trades | $${newsProfit} | ${newsWinRate}% WR | ${newsAvgR}R Avg`;

    document.getElementById("badEntryStats").textContent =
        `${badEntryCount} Trades | $${badEntryProfit} | ${badEntryWinRate}% WR | ${badEntryAvgR}R Avg`;

    document.getElementById("disciplineStats").textContent =
        `${disciplineCount} Trades | $${disciplineProfit} | ${disciplineWinRate}% WR | ${disciplineAvgR}R Avg`;

/* Day of Week Stats */ 
    document.getElementById("mondayStats").textContent =
        `${weekdayStats.Monday.count} Trades | $${weekdayStats.Monday.profit}`;

    document.getElementById("tuesdayStats").textContent =
        `${weekdayStats.Tuesday.count} Trades | $${weekdayStats.Tuesday.profit}`;

    document.getElementById("wednesdayStats").textContent =
        `${weekdayStats.Wednesday.count} Trades | $${weekdayStats.Wednesday.profit}`;

    document.getElementById("thursdayStats").textContent =
        `${weekdayStats.Thursday.count} Trades | $${weekdayStats.Thursday.profit}`;

    document.getElementById("fridayStats").textContent =
        `${weekdayStats.Friday.count} Trades | $${weekdayStats.Friday.profit}`;

    document.getElementById("saturdayStats").textContent =
        `${weekdayStats.Saturday.count} Trades | $${weekdayStats.Saturday.profit}`;

    document.getElementById("sundayStats").textContent =
        `${weekdayStats.Sunday.count} Trades | $${weekdayStats.Sunday.profit}`;

    document.getElementById("bestWeekday").textContent =
        bestWeekday ? `${bestWeekday} | $${bestProfit}` : "No trades yet";

    document.getElementById("worstWeekday").textContent =
        worstWeekday ? `${worstWeekday} | $${worstProfit}` : "No trades yet";

/* Risk to Reward Stats */
    document.getElementById("averageR").textContent = `${averageR}R`;

    document.getElementById("bestR").textContent =
        bestR === -Infinity
            ? "N/A"
            : `${bestR.toFixed(2)}R`;

    document.getElementById("averageWinR").textContent = `${avgWinRR.toFixed(2)}R`;

}

function sortTrades(sortType) {
    let sortedTrades = [...trades];

    if(sortType === "newest") {
        sortedTrades.sort((a, b) => b.id - a.id);
    } else if(sortType === "oldest") {
        sortedTrades.sort((a, b) => a.id - b.id);
    } else if(sortType === "highest") {
        sortedTrades.sort((a, b) => Number(b.profitLoss) - Number(a.profitLoss));
    } else if(sortType === "lowest") {
        sortedTrades.sort((a, b) => Number(a.profitLoss) - Number(b.profitLoss));
    }

    displayTrades(sortedTrades);
    setupDetailsButtons();
}

function setActiveButton(clickedButton, buttonGroup) {
  const buttons = document.querySelectorAll(buttonGroup);

  buttons.forEach((button) => {
    button.classList.remove("active-button");
  });

  clickedButton.classList.add("active-button");
}

function updateEquityChart() {
  const chartCanvas = document.getElementById("equityChart");

  if (!chartCanvas) return;

  let runningTotal = 0;

  const chartTrades = [...trades].reverse();

  const labels = chartTrades.map((trade, index) => {
    return `Trade ${index + 1}`;
  });

  const equityData = chartTrades.map((trade) => {
    runningTotal += Number(trade.profitLoss);
    return runningTotal;
  });

  if (equityChart !== null) {
    equityChart.destroy();
  }

  equityChart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Equity",
          data: equityData,
          tension: 0.3
        }
      ]
    }
  });
}

function calculatePairStats(pair) {
    const pairStats = {};

    trades.forEach((trade) => {
        const pair = trade.pair;
        const profitLossNumber = Number(trade.profitLoss);

        if(pairStats[pair] === undefined) {
            pairStats[pair] = 0;
        }
        pairStats[pair] += profitLossNumber;
    });

    const pairStatsDiv = document.getElementById("pairStats");
    pairStatsDiv.innerHTML = "";

    for(let pair in pairStats) {
        pairStatsDiv.innerHTML += `
        <p><strong>${pair}:</strong> ${pairStats[pair]}</p>
        `;
    }
}

function calculateDirectionStats(direction) {
  const directionStats = {};

  trades.forEach((trade) => {
    const direction = trade.direction.toUpperCase();
    const profitLossNumber = Number(trade.profitLoss);

    if (directionStats[direction] === undefined) {
      directionStats[direction] = 0;
    }

    directionStats[direction] += profitLossNumber;
  });

  const directionStatsDiv = document.getElementById("directionStats");
  directionStatsDiv.innerHTML = "";

  for (let direction in directionStats) {
    directionStatsDiv.innerHTML += `
    <p><strong>${direction}:</strong> ${directionStats[direction]}</p>
    `;
  }
}

function calculateMostTradedPair(trades){
    const pairCounts = {};

    trades.forEach((trade) => {
        const pair = trade.pair;

        if(pairCounts[pair] === undefined) {
            pairCounts[pair] = 0;
            
        }
        pairCounts[pair]++;

    });

    let mostTradedPair = "";
    let highestCount = 0;

    for(let pair in pairCounts) {
        if(pairCounts[pair] > highestCount) {
            highestCount = pairCounts[pair];
            mostTradedPair = pair;
        }
    }

    const mostTradedPairDiv = document.getElementById("mostTradedPair");

    mostTradedPairDiv.innerHTML = `
    <p><strong>${mostTradedPair}</strong> (${highestCount} trades)</p>
    `;
}

function calculateMonthlyStats(trades) {
  const monthlyStats = {};

  trades.forEach((trade) => {
    if (!trade.date) {
      return;
    }

    const month = trade.date.slice(0, 7);
    const profitLossNumber = Number(trade.profitLoss);

    if (monthlyStats[month] === undefined) {
      monthlyStats[month] = 0;
    }

    monthlyStats[month] += profitLossNumber;
  });

  const monthlyStatsDiv = document.getElementById("monthlyStats");
  monthlyStatsDiv.innerHTML = "";

  for (let month in monthlyStats) {
    monthlyStatsDiv.innerHTML += `
      <p><strong>${month}:</strong> $${monthlyStats[month]}</p>
    `;
  }
}

exportCsvBtn.addEventListener("click", () => {

  let csv = "Date,Pair,Direction,Profit/Loss,Notes\n";

trades.forEach((trade) => {
    csv += `${trade.date},${trade.pair},${trade.direction},${trade.profitLoss},${trade.notes}\n`;
  });

  const blob = new Blob([csv], {type: "text/csv"});
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "trades.csv";
  a.click();

  URL.revokeObjectURL(url);

}); 

function calculateTagComparison() {
    const selectedTag =
        document.getElementById("comparisonTag").value;

    const withTag = trades.filter(function(trade) {
        return trade.tags &&
            trade.tags.includes(selectedTag);
    });

    const withoutTag = trades.filter(function(trade) {
        return !trade.tags ||
            !trade.tags.includes(selectedTag);
    });

    const withTagCount = withTag.length;
    const withoutTagCount = withoutTag.length;

    let withTagProfit = 0;
    let withTagWins = 0;
    let withTagTotalR = 0;
    let withTagRCount = 0;

    let withoutTagProfit = 0;
    let withoutTagWins = 0;
    let withoutTagTotalR = 0;
    let withoutTagRCount = 0;

    withTag.forEach(function(trade) {
        const profitLoss = Number(trade.profitLoss);

        withTagProfit += profitLoss;

        if (profitLoss > 0) {
            withTagWins++;
        }

        if (trade.risk) {
            withTagTotalR +=
                Number(trade.profitLoss) / Number(trade.risk);

            withTagRCount++;
        }
    });

    const withTagWinRate =
        withTagCount > 0
            ? ((withTagWins / withTagCount) * 100).toFixed(2)
            : 0;

    const withTagAvgR =
        withTagRCount > 0
            ? (withTagTotalR / withTagRCount).toFixed(2)
            : 0;

    withoutTag.forEach(function(trade) {
        const profitLoss = Number(trade.profitLoss);

        withoutTagProfit += profitLoss;

        if (profitLoss > 0) {
            withoutTagWins++;
        }

        if (trade.risk) {
            withoutTagTotalR +=
                Number(trade.profitLoss) / Number(trade.risk);

            withoutTagRCount++;
        }
    });

    const withoutTagWinRate =
        withoutTagCount > 0
            ? ((withoutTagWins / withoutTagCount) * 100).toFixed(2)
            : 0;

    const withoutTagAvgR =
        withoutTagRCount > 0
            ? (withoutTagTotalR / withoutTagRCount).toFixed(2)
            : 0;

    document.getElementById("withTagStats").textContent =
        `With Tag: ${withTagCount} Trades | $${withTagProfit} | ${withTagWinRate}% WR | ${withTagAvgR}R Avg`;

    document.getElementById("withoutTagStats").textContent =
        `Without Tag: ${withoutTagCount} Trades | $${withoutTagProfit} | ${withoutTagWinRate}% WR | ${withoutTagAvgR}R Avg`;

}

document.getElementById("comparisonTag")
    .addEventListener("change", function() {
        calculateTagComparison();
    });

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        const selectedTab = button.dataset.tab;

        tabButtons.forEach(function(btn){
            btn.classList.remove("active");
        });

        tabContents.forEach(function(content) {
            content.classList.add("hidden");
        });

        button.classList.add("active");

        document.getElementById(selectedTab + "Tab")
            .classList.remove("hidden");
    });
});

function getDailyPL(trades){
    const dailyPL = {};

    trades.forEach(function(trade) {
        const day = trade.date.split("T")[0];

        if(!dailyPL[day]) {
            dailyPL[day] = { profit: 0, count: 0 };
        }

        dailyPL[day].profit += Number(trade.profitLoss);
        dailyPL[day].count++;
    })

    

    return dailyPL;
}

function getWeeklyPL(trades){
    const weeklyPL = {};

    const year = currentYear;
    const month = currentMonth;
    const firstDay = new Date(year, month, 1).getDay();

    trades.forEach(function(trade){
        const dateOnly = trade.date.split("T")[0];
        const dateParts = dateOnly.split("-");

        const tradeYear = Number(dateParts[0]);
        const tradeMonth = Number(dateParts[1]) - 1;
        const tradeDay = Number(dateParts[2]);

        if(tradeYear == currentYear && tradeMonth == currentMonth){
            const weekNumber = Math.ceil((tradeDay + firstDay) / 7);

            if (!weeklyPL[weekNumber]) {
                weeklyPL[weekNumber] = {
                    profit: 0,
                    trades: 0
                };
            }

            weeklyPL[weekNumber].profit += Number(trade.profitLoss);
            weeklyPL[weekNumber].trades++;
        }
    });
    return weeklyPL;
}

function renderCalendar(trades){
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    const dailyPL = getDailyPL(trades);
    const weeklyPL = getWeeklyPL(trades);

    const weeklySummary = 
        document.getElementById("weeklySummary");
        weeklySummary.innerHTML = "";

    const year = currentYear;
    const month = currentMonth;

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    document.getElementById("calendarTitle").textContent = `${months[month]} ${year}`;

   

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const totalCells = firstDay + daysInMonth;
    const totalWeeks = Math.ceil(totalCells / 7);
    

    for(let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-cell", "empty");
        calendar.appendChild(emptyCell);
    }

    for(let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.classList.add("calendar-day");

        const monthString = String(month + 1).padStart(2, "0");
        const dayString = String(day).padStart(2, "0");
        const dateString = `${year}-${monthString}-${dayString}`;

        const dayData = dailyPL[dateString];

         

        if(dayData) {
            
            if(dayData.profit > 0) {
                dayCell.classList.add("calendar-profit");
            }
            else if(dayData.profit < 0) {
                dayCell.classList.add("calendar-loss");
            }
            else {
                dayCell.classList.add("calendar-neutral");
            }
            
            dayCell.innerHTML = `
                <span>${day}</span>
                <p class="day-profit">$${dayData.profit}</p>
                <p class="day-trades">${dayData.count} trades</p>
            `;

        } else {
            dayCell.innerHTML = `<span>${day}</span>`;
        }

        calendar.appendChild(dayCell);
    }

    let monthProfit = 0;
    let monthTrades = 0;

    for (let week = 1; week <= totalWeeks; week++){
        const weekCell = document.createElement("div");
        weekCell.classList.add("week-card");

        const weekData = weeklyPL[week] || {
            profit: 0,
            trades: 0
        };

        monthProfit += weekData.profit;
        monthTrades += weekData.trades;

        let profitClass = "neutral-text";

        if(weekData.profit > 0) {
            profitClass = "profit-text";
        }else if(weekData.profit < 0) {
            profitClass = "loss-text";
        }

        weekCell.innerHTML = `
        <h4> Week ${week}</h4>
        <p class = "week-profit ${profitClass}">$${weekData.profit}</p>
        <p class = "week-trades">${weekData.trades} trades</p>
        `;

        weeklySummary.appendChild(weekCell);

}

    const totalCard = document.createElement("div");
            totalCard.classList.add("week-card", "month-total-card");

            let monthProfitClass = "neutral-text";

            if(monthProfit > 0) {
                monthProfitClass = "profit-text";
            } else if(monthProfit < 0) {
                monthProfitClass = "loss-text";
            }

            totalCard.innerHTML = `
                <h4> MONTH TOTAL </h4>
                <p class = "week-profit ${monthProfitClass}">$${monthProfit}</p>
                <p class = "week-trades">${monthTrades} trades</p>
            `;
            weeklySummary.prepend(totalCard);
};

document.getElementById("nextMonth")
    .addEventListener("click", function() {

        currentMonth++;

        if(currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }

        renderCalendar(trades);
    });

document.getElementById("prevMonth")
    .addEventListener("click", function() {
        currentMonth--;
        if(currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(trades);
    });

let reviews = JSON.parse(localStorage.getItem("reviews")) || [];
let editingReviewIndex = null;

function saveReviews() {
     localStorage.setItem("reviews", JSON.stringify(reviews));
}

function displayReviews() {
    const reviewHistory = document.getElementById("reviewHistory");
    const emptyReviewMessage = document.getElementById("emptyReviewMessage");
    
    reviewHistory.innerHTML = "";

    if(reviews.length === 0) {
        emptyReviewMessage.classList.remove("hidden");
    } else {
        emptyReviewMessage.classList.add("hidden");
    }

    reviews.forEach(function(review, index) {
        const reviewCard = document.createElement("div");
        reviewCard.classList.add("review-card");

        reviewCard.innerHTML = `
            <p><strong>Date:</strong> ${review.date}</p>
            <p><strong>Went Well:</strong> ${review.good}</p>
            <p><strong>Went Wrong:</strong> ${review.bad}</p>
            <p><strong>Emotion:</strong> ${review.emotion}</p>
            <p><strong>Lesson:</strong> ${review.lesson}</p>
            <button class="edit-review-btn">Edit</button>
            <button class="delete-review-btn">Delete</button>
        `;

        reviewHistory.appendChild(reviewCard);

        const deleteBtn = reviewCard.querySelector(".delete-review-btn");

        deleteBtn.addEventListener("click", function() {
            reviews.splice(index, 1);
            saveReviews();
            displayReviews();
        });

        const editBtn = reviewCard.querySelector(".edit-review-btn");

        editBtn.addEventListener("click", function() {
            document.getElementById("reviewGood").value = review.good;
            document.getElementById("reviewBad").value = review.bad;
            document.getElementById("reviewEmotion").value = review.emotion;
            document.getElementById("reviewLesson").value = review.lesson;

            editingReviewIndex = index;
        });

    });
}

document.getElementById("saveReviewBtn").addEventListener("click", function() {
    const review = {
        date: new Date().toLocaleDateString(),
        good: document.getElementById("reviewGood").value,
        bad: document.getElementById("reviewBad").value,
        emotion: document.getElementById("reviewEmotion").value,
        lesson: document.getElementById("reviewLesson").value
    };

    if (editingReviewIndex === null) {
        reviews.push(review);
    } else {
        reviews[editingReviewIndex] = review;
        editingReviewIndex = null;
    }
    saveReviews();
    displayReviews();

    document.getElementById("reviewGood").value = "";
    document.getElementById("reviewBad").value = "";
    document.getElementById("reviewEmotion").value = "";
    document.getElementById("reviewLesson").value = "";
});
displayReviews();

let goals = JSON.parse(localStorage.getItem("goals")) || [];

let editingGoalIndex = null;

function saveGoals() {
    localStorage.setItem("goals", JSON.stringify(goals));
}

function addGoal() {
    const title = document.getElementById("goalTitle").value;
    const target = Number(document.getElementById("goalTarget").value);
    const current = Number(document.getElementById("goalCurrent").value);
    const deadline = document.getElementById("goalDeadline").value;

    if (target <= 0) {
        alert("Target must be greater than 0.");
        return;
    }

    if (current < 0) {
        alert("Current progress cannot be negative.");
        return;
    }

    const goal = {
        title: title,
        target: target,
        current: current,
        deadline: deadline
    };

    if (editingGoalIndex === null) {
        goals.push(goal);
    } else {
        goals[editingGoalIndex] = goal;
        editingGoalIndex = null;
    }

    saveGoals();
    displayGoals();

    document.getElementById("goalTitle").value = "";
    document.getElementById("goalTarget").value = "";
    document.getElementById("goalCurrent").value = "";
    document.getElementById("goalDeadline").value = "";
}

function displayGoals() {
    const goalHistory = document.getElementById("goalHistory");
    const emptyGoalMessage = document.getElementById("emptyGoalMessage");

    goalHistory.innerHTML = "";

    if (goals.length === 0) {
        emptyGoalMessage.classList.remove("hidden");
    } else {
        emptyGoalMessage.classList.add("hidden");
    }


    goals.forEach(function(goal, index) {
        let progressPercent = (goal.current / goal.target) * 100;

        if (progressPercent > 100) {
            progressPercent = 100;
        }

        let goalComplete = "";
        if(goal.current >= goal.target){
            goalComplete = "Completed!"
        }

        const today = new Date();
        const deadlineDate = new Date(goal.deadline);

        let goalOverdue = "";
        if (deadlineDate < today && goal.current < goal.target) {
            goalOverdue = "Overdue!";
        }

        const goalCard = document.createElement("div");
        goalCard.classList.add("goal-card");

        goalCard.innerHTML = `
            <h3>${goal.title}</h3>
            <p><strong>Target:</strong> ${goal.target}</p>
            <p><strong>Current:</strong> ${goal.current}</p>
            <p><strong>Progress:</strong> ${progressPercent.toFixed(1)}%</p>
            <p><strong>Deadline:</strong> ${goal.deadline}</p>

            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>

            <p>${goalComplete}</p>
            <p>${goalOverdue}</p>
            <button onclick="editGoal(${index})">Edit</button>
            <button onclick="deleteGoal(${index})">Delete</button>
        `;

        goalHistory.appendChild(goalCard);
    });
}

function deleteGoal(index) {
    goals.splice(index, 1);
    saveGoals();
    displayGoals();
}

function editGoal(index){
    const goal = goals[index];
    document.getElementById("goalTitle").value = goal.title;
    document.getElementById("goalTarget").value = goal.target;
    document.getElementById("goalCurrent").value = goal.current;
    document.getElementById("goalDeadline").value = goal.deadline;
    editingGoalIndex = index;
    saveGoals();
    displayGoals();
}
displayGoals();

function setActiveDirectionButton(clickedButton){
    const directionButtons = document.querySelectorAll(".filter-section button");

    directionButtons.forEach(function(button) {
        button.classList.remove("active-filter");
    });

    clickedButton.classList.add("active-filter");
}

function setActiveButton(clickedButton, groupSelector) {
    const buttons = document.querySelectorAll(groupSelector);

    buttons.forEach(function(button) {
        button.classList.remove("active-filter");
    });

    clickedButton.classList.add("active-filter");
}
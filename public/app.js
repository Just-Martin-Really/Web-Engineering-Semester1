const button = document.getElementById("check");
const result = document.getElementById("result");

button.addEventListener("click", async () => {
    const response = await fetch("/api/health");
    const data = await response.json();

    result.textContent = JSON.stringify(data, null, 2);
});
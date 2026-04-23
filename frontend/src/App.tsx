import QueryTable from "./components/QueryTable";

function App() {
  return (
    <div>
      <h1 style={{ padding: "20px 16px 0 16px", fontSize: 24 }}>Поисковые запросы</h1>
      <p style={{ padding: "0 16px", color: "#000000", fontSize: 14, marginBottom: 0 }}>
        Разработчик: Васюкова Наталья
      </p>
      <QueryTable />
    </div>
  );
}

export default App;
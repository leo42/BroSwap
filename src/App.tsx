import  { useState } from 'react';
import './App.css'
import Swap from './components/swap'
import { FaSun, FaMoon } from 'react-icons/fa';



function App() {
  const [lightMode, setLightMode] = useState(true);

  const toggleTheme = () => {
    setLightMode(!lightMode);
    const rootElement = document.getElementById('root');
    rootElement.classList.toggle('darkMode');
    rootElement.classList.toggle('lightMode');
  }

  return (
    <div className='app'>
      <div className="beta-banner">
        This is a beta version. By using this app, you agree to our <a href="https://github.com/leo42/broswap/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">license</a>.
      </div>
      <button className='themeToggleButton' onClick={toggleTheme}>
        {lightMode ? <FaSun /> : <FaMoon />}
      </button>
      <Swap/>
    </div>
  )
}

export default App

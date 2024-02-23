
import React from "react"
import Die from "./Components/Die"
import './style.css'
import { nanoid } from "nanoid"
import Confetti from 'react-confetti'
import {onSnapshot,addDoc,doc,setDoc,query,where,getDocs} from "firebase/firestore"
import { gameScoresCollection, db } from "./firebase"
import Popup from './Components/popup/Popup';
import Name from "./Components/name/Name"

export default function App() {
  const [dice, setDice] = React.useState(allNewDice()) 
  const [tenzies, setTenzies] = React.useState(false)
  const [rollsNumber, setRollsNumber] = React.useState(0);
  const [time, setTime] = React.useState(0);
	const [timerOn, setTimerOn] = React.useState(false);
  const [bestRolls, setBestRolls] = React.useState(
    JSON.parse(localStorage.getItem("bestRolls")) || 0
  );
  const [bestTime, setBestTime] = React.useState(
    JSON.parse(localStorage.getItem("bestTime")) || 0
  );
  const [highScore, highScoreData] = React.useState([])
  const [currentPlayerId, setCurrentPlayerId] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(true);
  const togglePopup = () => {
    setIsOpen(!isOpen);
  }
  const [newplayerName, setNewplayerName] = React.useState("");

  function setRecords() {
    if (!bestRolls || rollsNumber < bestRolls) {
      setBestRolls(rollsNumber);
    }

    const timeFloored = Math.floor(time / 10);
    if (!bestTime || timeFloored < bestTime) {
      setBestTime(timeFloored);
    }
  }

  React.useEffect(() => {
    localStorage.setItem("bestRolls", JSON.stringify(bestRolls));
  }, [bestRolls]);

  React.useEffect(() => {
    localStorage.setItem("bestTime", JSON.stringify(bestTime));
  }, [bestTime]);

  React.useEffect(() => {
      const allHeld = dice.every(die => die.isHeld)
      const firstValue = dice[0].value
      const allSameValue = dice.every(die => die.value === firstValue)
      if (allHeld && allSameValue) {
          setTenzies(true);
          var tempRolls = rollsNumber < highScore.minRoll ? rollsNumber : ''
          var tempTime  = time < highScore.minTime ? time : ''
            updateScore(tempRolls,tempTime)
          setTimerOn(false);
          setRecords();
      }
  }, [dice]) 

  React.useEffect(() => {
		let interval = null;

		if (timerOn) {
			interval = setInterval(() => {
				setTime((prevTime) => prevTime + 10);
			}, 10);
		}
		return () => clearInterval(interval);
	}, [timerOn]);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(gameScoresCollection, (snapshot) => {
      const newData = snapshot.docs.map((doc) => doc.data());
      var minTime  = { bestTime : 0 , bestRoll : 0 ,playerName:"NA"};
      var minRoll  = { bestTime : 0 , bestRoll : 0 ,playerName:"NA"};
      const filteredNewData = newData.filter(player => player.bestTime > 0 && player.bestRoll > 0 );
      if(filteredNewData.length > 0){
         minTime = filteredNewData.reduce(function(res, obj) {
          return (obj.bestTime < res.bestTime) ? obj : res;
        });
         minRoll = filteredNewData.reduce(function(res, obj) {
          return (obj.bestRoll < res.bestRoll) ? obj : res;
        });
      }
      const newDataArr = {
        minTime:minTime.bestTime/1000,
        minTimePlayer: minTime.playerName,
        minRoll:minRoll.bestRoll,
        minRollPlayer: minRoll.playerName,
      }

      highScoreData(newDataArr)
      console.log(newDataArr)
    });
    return () => unsubscribe();
  }, []);


  const handleNameChange = (e) => {
    setNewplayerName(e.target.value)
}

  function generateNewDie() {
    return {
        value: Math.ceil(Math.random() * 6),
        isHeld: false,
        id: nanoid()
    }
  }

  function allNewDice() {
      const newDice = []
      for (let i = 0; i < 10; i++) {
        newDice.push(generateNewDie())
      }
      return newDice
  }
  
  function rollDice() {
    if(tenzies){
      setTenzies(false)
      setDice(allNewDice())
      setRollsNumber(0);
			setTime(0);
      const items = {"rolls":rollsNumber,"time":time}
      localStorage.setItem('highscore', JSON.stringify(items));
    }else{
      setDice(oldDice => oldDice.map(die => {
      return die.isHeld ? 
          die : generateNewDie()
      }))
      setRollsNumber((prevRollsNumber) => {
				return (prevRollsNumber = prevRollsNumber + 1);
			});
			setTimerOn(true);
    }
    
  }
  
  function holdDice(id) {
    setTimerOn(true);
    setDice(oldDice =>  oldDice.map(die =>{
      return die.id===id ? 
            {...die,isHeld:!die.isHeld} :
            die
    }))
  }

  async function createNewPlayer() {
    const q = query(gameScoresCollection, where("playerName", "==", newplayerName));
    const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
          const playerDoc = querySnapshot.docs[0];
          setCurrentPlayerId(playerDoc.id)
      }else{
          const newPlayer = {
                  playerName: newplayerName,
                  bestRoll:"0",
                  bestTime:"0",
                  createdAt: Date.now(),
                  updatedAt: Date.now()
              }
          const playerRef = await addDoc(gameScoresCollection, newPlayer)
          setCurrentPlayerId(playerRef.id)
      } 
    setNewplayerName(newplayerName)
    setIsOpen(!isOpen)
  }

  async function updateScore(rollsNumber,time) {
    const docRef = doc(db, "game-scores", currentPlayerId)
    const data = {} ;
    if(rollsNumber!=''){
      data['bestRoll']= rollsNumber
    }
    if(time!=''){
      data['bestTime']= time
    }
    data['updatedAt']= Date.now();
    await setDoc(
        docRef, 
        data, 
        { merge: true }
    )
}

  const diceElements = dice.map(die => <Die key={die.id} value={die.value} isHeld={die.isHeld} holdDice={()=>holdDice(die.id)} rollsNumber={rollsNumber}
  timer={time}/>)
  
  return (
      <main>
        {tenzies && <Confetti />}
        <Name />
        <p className="instructions">Roll until all dice are the same. Click each die to freeze it at its current value between rolls.</p>
        <div className='player--container'>
          Welcome {newplayerName}
        </div>
        <div className='highScore-container'>
          <p><b>Global Best Score : </b>{highScore.minRoll}</p>
          <p><b>Global Best Time : </b> {highScore.minTime}s</p>
        </div>
        <div className='highScore-container'>
          <p><b>Scorer :</b> {highScore.minRollPlayer}</p>
          <p><b>Scorer :</b> {highScore.minTimePlayer}</p>
        </div>
        <hr></hr>
        <div className='highScore-container'>
          <p><b>Your Best Score : </b>{bestRolls}</p>
          <p><b>Your Best Time : </b> {bestTime / 100}s</p>
        </div>
        <div className='rolls-time-container'>
            <p>Rolls: {rollsNumber}</p>
            <p>
              Time:
              <span>{('0' + Math.floor((time / 60000) % 60)).slice(-2)}:</span>
              <span>{('0' + Math.floor((time / 1000) % 60)).slice(-2)}:</span>
              <span>{('0' + ((time / 10) % 100)).slice(-2)}</span>
            </p>
        </div>
        <div className="dice-container">
            {diceElements}
        </div>
        <button 
          className="roll-dice" 
          onClick={rollDice}
        >{tenzies ? "New Game" : "Roll"}</button>
        {
        isOpen && <Popup
          content={
            <div className="name--input">
              <b className="input--text">Enter Your Name</b>
              <input type="text" className="input--name" onChange={handleNameChange}/>
              <button className="input--button" type="submit" onClick={createNewPlayer}>Save</button>
            </div>
          }
          handleClose={togglePopup}
        />
        }
      </main>
  )
}
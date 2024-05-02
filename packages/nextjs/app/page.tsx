"use client";

import Link from "next/link";
import React, { useState, useEffect } from 'react';
import type { NextPage } from "next";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address, Balance } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract,useDeployedContractInfo, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { parseEther, formatEther, maxUint256 } from 'viem';
import { TimerContainer } from './TimerContainer'
import { TimerInput } from './TimerInput'
import { Integer } from "type-fest";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [ firstN, setFirstN ] = useState("");
  const [ secondN, setSecondN ] = useState("");
  const [ thirdN, setThirdN ] = useState("");
  const [ fourthN, setFourthN ] = useState("");
  const [ fifthN, setFifthN ] = useState("");
  const [ sixthN, setSixthN ] = useState("");
  const [ tokenToBurn, setTokenToBurn ] = useState("");
  const [ winnings, setWinnings ] = useState("");
  
  const [time, setTime] = useState<number>(7);
  const [newTime, setNewTime] = useState<number>(0)
  const [days, setDays] = useState<number>(0);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [message, setMessage] = useState<string>("");

 const timeToDays = time * 60 * 60 * 24 * 1000;

 let countDownDate = new Date().getTime() + timeToDays;

 useEffect(() => {

  var updateTime = setInterval(() => {
    var now = new Date().getTime();

    var difference = countDownDate - now;

    var newDays = Math.floor(difference / (1000 * 60 * 60 * 24));
    var newHours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var newMinutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    var newSeconds = Math.floor((difference % (1000 * 60)) / 1000);

    setDays(newDays);
    setHours(newHours);
    setMinutes(newMinutes);
    setSeconds(newSeconds);

    if (difference <= 0) {
      clearInterval(updateTime);
      setMessage("The Launch Has Started");
      setDays(0);
      setHours(0);
      setMinutes(0);
      setSeconds(0);
    }
  })

  return () => {
    clearInterval(updateTime);
  }

}, [time]);

const handleClick = () => {

  setTime(newTime);
  console.log(time);
  setNewTime(0);
};

const handleChange = (e: any) => {
  let inputTime = e.target.value;
  setNewTime(inputTime);

};


  const MAX_NUMBER = 69;
  const MAX_POWERBALL_NUMBER = 26;
  const contract = useDeployedContractInfo("Lottery");
  const [tokenMessage, setTokenMessage] = useState("");

  const betStatus = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "betsOpen",
  });

  const { data: myContract } = useScaffoldContract({
    contractName: "Lottery",
  });
  const numbersDrawn = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "getNumbers",
  });

  const prizePool = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "prizePool",
  });

  const { writeContractAsync:drawTicket } = useScaffoldWriteContract("Lottery");
  const who = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "who",
  });

  const {writeContractAsync:approvePayout} = useWriteContract();
  const { writeContractAsync:burnTokens } = useScaffoldWriteContract("Lottery");

  const { writeContractAsync:buyTokens } = useScaffoldWriteContract("Lottery");
  const token = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "paymentToken",
  });

  const { writeContractAsync:openBets } = useScaffoldWriteContract("Lottery");
  const { writeContractAsync:drawNumbers } = useScaffoldWriteContract("Lottery");

  const tokenBalance = useReadContract({
    address: token.data,
    abi: [{
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: "balanceOf",
    args: [connectedAddress as string],
  });

  
  return (
    <>
<div className="grid gap-8 grid-cols-3 grid-rows-2">  

<div className="stats stats-vertical shadow">
  
<div className="stat">
    <div className="stat-title">Lottery</div>
    <div className="stat-value"><Address address = {contract.data?.address} /></div>
    <div className="stat-desc">Evaluation</div>
  </div>
  <div className="stat">
    <div className="stat-title">Contract Balance</div>
    <div className="stat-value"><Balance address = {contract.data?.address} /></div>
    <div className="stat-desc"> </div>
  </div>
  <div className="stat">
    <div className="stat-title">Lottery Status</div>
    <div className="stat-value">{betStatus.data == true? "Open" : "Closed"}</div>
    <div className="stat-desc"> </div>
  </div>
  <div className="stat">
    <div className="stat-title">Lottery Control</div>
    <div className="stat-value"><button className="btn btn-neutral" onClick={async ()=>{
      try {
        await openBets({
          functionName: "openBets",
          args: [BigInt(30)],
        });
      } catch (e) {
        console.error("Error:",e);
      }
    }}>Open Bets</button>
    <button className="btn btn-neutral" onClick={async ()=>{
      try {
        await drawNumbers({
          functionName: "closeLottery",
          account: connectedAddress as string,
        });
      } catch (e) {
        console.error("Error:",e);
      }
      numbersDrawn.refetch();
    }}>Draw Numbers</button>
    <button className="btn btn-neutral" onClick={async ()=>{
        const valueX = await myContract?.simulate.checkPrize();
        setWinnings(String(valueX));
      numbersDrawn.refetch();
    }}>Check Prize</button>

</div>
    <div className="stat-desc"> </div>
  </div>
  <div className="stat">
    <div className="stat-title">Lottery Pool</div>
    <div className="stat-value">{formatEther(typeof(prizePool.data) === "undefined" ? 0n : prizePool.data)}</div>
    <div className="stat-desc">LOT </div>
  </div>

</div>
        
{/*  <div>
        <input type="text"
        placeholder="[1,2,3,4,5,6]"
        className="input input-bordered input-primary w-full max-w-xs"
        onChange={e => setNumbers(e.target.value)} />
      <button className="btn btn-primary"
      onClick={
        async ()=>{
          var sNums = numbers;
          var nums = new Array<bigint>;
          sNums = sNums.replace("[","");
          sNums = sNums.replace("]","");
          sNums.split(",").forEach((n)=> nums.push(BigInt(n)))
          console.log(nums);
          try {
          await drawTicket({
            functionName: "bet",
            args: [nums],
          });
        }catch(e){
            console.log(e);
          }
        }
      }>Bet</button>
*/}

  <div>
  <TimerContainer
        days={days}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
      />
      <p>
      <span className="text-3xl">Last winning Numbers</span>
      </p>
      <div className="avatar placeholder">
      <div className="bg-neutral text-neutral-content rounded-full w-20">
        <span className="text-3xl">{String(typeof(numbersDrawn.data) === "undefined" ? "0":numbersDrawn.data[0])}</span>
        </div>
        <div className="bg-neutral text-neutral-content rounded-full w-20">
        <span className="text-3xl">{String(typeof(numbersDrawn.data) === "undefined" ? "0":numbersDrawn.data[1])}</span>
        </div>
        <div className="bg-neutral text-neutral-content rounded-full w-20">
        <span className="text-3xl">{String(typeof(numbersDrawn.data) === "undefined" ? "0":numbersDrawn.data[2])}</span>
        </div>
        <div className="bg-neutral text-neutral-content rounded-full w-20">
        <span className="text-3xl">{String(typeof(numbersDrawn.data) === "undefined" ? "0":numbersDrawn.data[3])}</span>
        </div>
        <div className="bg-neutral text-neutral-content rounded-full w-20">
        <span className="text-3xl">{String(typeof(numbersDrawn.data) === "undefined" ? "0":numbersDrawn.data[4])}</span>
        </div>
        </div>
        <div className="avatar placeholder online">
        <div className="bg-neutral text-neutral-content rounded-full w-24">
        <span className="text-3xl">{String(typeof(numbersDrawn.data) === "undefined" ? "0":numbersDrawn.data[5])}</span>
        </div>
      </div>
      {/*<TimerInput value={newTime} handleClick={handleClick} handleChange={handleChange} />*/}

{/*
      <button className="btn btn-primary"
      onClick={()=>{
        who?.refetch();
        console.log(who.data);
        setRNumber(String(Math.ceil(Math.random()*49)));
        drawNumbers.refetch();
      }
      }>random</button>
    <label>{String(who?.data)}</label>
    <label>{String(rNumber)}</label>
    */} 

<span className="text-3xl">Pick your numbers</span>
  <p>
  <input type="text" placeholder="first" id="firstN" className="input input-bordered w-14" onChange={e => {setFirstN(e.target.value);}} />
  <input type="text" placeholder="second" id="secondN" className="input input-bordered w-14" onChange={e => {setSecondN(e.target.value);}} />
  <input type="text" placeholder="third" id="thirdN" className="input input-bordered w-14" onChange={e => {setThirdN(e.target.value);}} />
  <input type="text" placeholder="fourth" id="fourthN" className="input input-bordered w-14" onChange={e => {setFourthN(e.target.value);}} />
  <input type="text" placeholder="fifth" id="fifthN" className="input input-bordered w-14" onChange={e => {setFifthN(e.target.value);}} />
  &nbsp;&nbsp;&nbsp;
  <input type="text" placeholder="super" id="sixthN" className="input input-bordered input-secondary w-14" onChange={e => {setSixthN(e.target.value);}} />
  </p>
  <button className="btn btn-neutral w-36" onClick={() => {
    document.getElementById("firstN").value = Math.ceil(Math.random()*MAX_NUMBER);
    setFirstN(document.getElementById("firstN").value);
    document.getElementById("secondN").value = Math.ceil(Math.random()*MAX_NUMBER);
    setSecondN(document.getElementById("secondN").value);
    document.getElementById("thirdN").value =  Math.ceil(Math.random()*MAX_NUMBER);
    setThirdN(document.getElementById("thirdN").value);
    document.getElementById("fourthN").value = Math.ceil(Math.random()*MAX_NUMBER);
    setFourthN(document.getElementById("fourthN").value);
    document.getElementById("fifthN").value = Math.ceil(Math.random()*MAX_NUMBER);
    setFifthN(document.getElementById("fifthN").value);
    document.getElementById("sixthN").value = Math.ceil(Math.random()*MAX_POWERBALL_NUMBER);
    setSixthN(document.getElementById("sixthN").value);
  }
  }>Random</button>
  <button className="btn btn-primary w-36"
      onClick={
        async ()=>{
          var nums = new Array<bigint>;
          nums.push(BigInt(firstN));
          nums.push(BigInt(secondN));
          nums.push(BigInt(thirdN));
          nums.push(BigInt(fourthN));
          nums.push(BigInt(fifthN));
          nums.push(BigInt(sixthN));
          console.log(nums);
          try {
            await approvePayout({
              abi:[{
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                  }
                ],
                "name": "approve",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
              }],
              functionName : "approve",
              address: String(token.data),
              args: [String(contract.data?.address), maxUint256],
            });

          await drawTicket({
            functionName: "bet",
            args: [nums],
          });
          tokenBalance.refetch()
          prizePool.refetch();
        }catch(e){
            console.log(e);
          }
        }
      }>Bet</button>    

    
  </div>
  <div className="stats stats-vertical shadow">
  
    <div className="stat">
      <div className="stat-title">Connected Account</div>
      <div className="stat-value"><Address address = {connectedAddress} /></div>
    </div>
    
    <div className="stat">
      <div className="stat-title">Tokenbalance</div>
      <div className="stat-value">{String(typeof(tokenBalance.data) === "bigint" ? formatEther(tokenBalance.data):BigInt(0))}</div>
      <div className="stat-desc">LOT</div>
    </div>
    
    <div className="stat">
      <div className="stat-title">Bought tickets</div>
      <div className="stat-value">{String(who?.data)}</div>
    </div>

    <div className="stat">
    <div className="stat-title">Buy tokens</div>    
      <div className="stat-value">
      <button className="btn btn-neutral" onClick={async ()=>{
        try {
          await buyTokens({
            functionName: "purchaseTokens",
            value: parseEther(tokenMessage as string),
            account: connectedAddress as string,
          });
        } catch (e) {
          console.error("Error:",e);
        }
        tokenBalance.refetch();
      }}>Buy</button>
        <input placeholder="Eth" className="input input-bordered" 
        onChange={e => {setTokenMessage(e.target.value);}}
      />
    </div>
    <div className="stat-desc">You get {parseInt(tokenMessage)*100} LOT
    </div>
    </div>

    <div className="stat">
    <div className="stat-title">Sell tokens</div>    
      <div className="stat-value">
      <button className="btn btn-neutral" onClick={async ()=>{
        try {
          await approvePayout({
            abi:[{
              "inputs": [
                {
                  "internalType": "address",
                  "name": "spender",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "value",
                  "type": "uint256"
                }
              ],
              "name": "approve",
              "outputs": [
                {
                  "internalType": "bool",
                  "name": "",
                  "type": "bool"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "function"
            }],
            functionName : "approve",
            address: String(token.data),
            args: [String(contract.data?.address), maxUint256],
          });}
          catch(e){
            console.log(e);
          }

        await burnTokens({
          functionName: "returnTokens",
          args: [parseEther(tokenToBurn)],
        });
        tokenBalance.refetch();
      }}>Sell</button>
        <input placeholder="LOT" className="input input-bordered" 
        onChange={e => {setTokenToBurn(e.target.value);}}
      />
    </div>
    <div className="stat-desc">You get {parseInt(tokenToBurn)/100} ETH
    </div>
    </div>

  </div>

  <div><label></label></div>

  <div>

  </div>

</div>
    </>
  );
};

export default Home;

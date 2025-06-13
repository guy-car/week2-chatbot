"use client";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function Hello() {
  const [inputText, setInputText] = useState("");
  
  const { data } = api.post.hello.useQuery({ text: inputText });
  
  return (
    <>
      <input 
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter your name here"
      />
      <p>{data?.greeting}</p>
    </>
  );
}
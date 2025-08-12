import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Dash({name}) {
  const navigate = useNavigate();
  return (
    <div>
        <p>Welcome {name}</p>
    </div>
  );
}

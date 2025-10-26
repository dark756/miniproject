import axios, { AxiosError } from "axios";
import React, { useState, useEffect } from "react";


/*
- get check if we have details
- if yes
    - load into form
- if no
    - load empty form
- fill form
- confirm and upload changes/new details




*/




const jobroles = [
  "Intern Software Developer",
  "Junior Software Developer",
  "Software Developer",
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile App Developer",
  "Game Developer",
  "DevOps Engineer",
  "Machine Learning Engineer",
  "Embedded Systems Engineer",
  "Robotics Engineer"
];

const stackToLanguages = {
  "MERN Stack": ["JavaScript", "Node.js", "HTML", "CSS"],
  "fastAPI + next.js":["Python", "Javascript"],
  "Next.js": ["JavaScript", "TypeScript"],
  "Angular": ["TypeScript", "HTML", "CSS"],
  "Spring Boot": ["Java", "Kotlin"],
  "Django": ["Python"],
  "FastAPI": ["Python"],
  "Ruby on Rails": ["Ruby"],
  "Flutter": ["Dart"],
  "Kotlin (Android)": ["Kotlin"],
  "Swift (iOS)": ["Swift"],
  "Firebase Stack": ["JavaScript", "TypeScript"],
  "T3 Stack (Next.js + tRPC + Prisma + Tailwind)": ["TypeScript", "JavaScript"],
  "Serverless Stack (AWS Lambda, API Gateway, DynamoDB)": ["Python", "Node.js", "Go"],
  "Machine Learning Stack (Python + TensorFlow/PyTorch)": ["Python"],
  "Data Engineering Stack (Spark + Airflow + Kafka)": ["Python", "Scala", "Java"],
  "DevOps Stack (Docker + Kubernetes + Jenkins + Terraform)": ["YAML", "Bash", "Python"]
};
const stackOptions = Object.keys(stackToLanguages);

const languageOptions= [
  "JavaScript",
  "TypeScript",
  "Node.js",
  "HTML",
  "CSS",
  "Java",
  "Kotlin",
  "Python",
  "Ruby",
  "Dart",
  "Swift",
  "Go",
  "Scala",
  "YAML",
  "Bash",
  "C",
  "C++",
  "C#",
  "PHP",
  "Objective-C",
  "R",
  "Assembly",
  "Fortran"
];

export default function Details ({name}) {
  const [jobrole, setJobrole] = useState("");
  const [tech, setTech] = useState([]);
  const [progLangs , setProgLangs] = useState([]);
  const [dob, setDob] = useState("");
  const [education, setEd] = useState([]);
  const [selectedEdIndex, setSelectedEdIndex] = useState(null);
  const emptyEd={
    institute: null,
    location: null, 
    grad_year: null, 
    degree: null, 
    cgpa: null, 
    honours: null
  }
  const [certifications, setCerts] = useState([]);
const [selectedCertIndex, setSelectedCertIndex] = useState(null);

const emptyCert = { name: null, date: null, provider: null };

const [workex, setWork] = useState([]);
const [selectedWorkIndex, setSelectedWorkIndex] = useState(null);

const emptyWork = { company: "", start_date:null, end_date: null, role: null, remarks: null };
  const [other_remarks, setRemarks] = useState("");

const [pop, setPop]=useState(false);
const [show, setShow]=useState(false);
const [failed, setFailed]=useState(false);
useEffect(() => {
  const requiredLangs = new Set();
  tech.forEach(stack => {
    (stackToLanguages[stack] || []).forEach(lang => requiredLangs.add(lang));
  });

  setProgLangs(prevLangs => {//add langs if tech stacks are added
    const newLangsSet = new Set(prevLangs);
    let changed = false;

    requiredLangs.forEach(lang => {
      if (!newLangsSet.has(lang)) {
        newLangsSet.add(lang);
        changed = true;
      }
    });

    if (changed) {
      return Array.from(newLangsSet);
    }
    return prevLangs; 
  });
}, [tech]);


useEffect(()=>{
    //call get deets and prefill form if present might need api changes
    const get_details = async()=>
    {
        const res=await axios.get("http://localhost:5000/check-details",
            {validateStatus: () => true, withCredentials: true})
        console.log(res)
        if (res.status===200 && res.data.detailsFound===true)
        {
            //setter
            const details=res.data.details;
            setJobrole(details.jobrole);
            setTech(details.tech);
            setProgLangs(details.progLangs);
            setEd(details.education);
            setWork(details.workex);
            setCerts(details.certifications);
            setRemarks(details.other_remarks);
            setDob(details.dob||"");
        }
    }
    get_details();
},[])
useEffect(() => {//removes tech stacks if langs are removed
  setTech(prevTech => {
    const filtered = prevTech.filter(stack => {
      const langs = stackToLanguages[stack] || [];
      return langs.every(lang => progLangs.includes(lang));
    });
    const isDifferent =
      filtered.length !== prevTech.length ||
      filtered.some((s, i) => s !== prevTech[i]);
    return isDifferent ? filtered : prevTech;
  });
}, [progLangs]);

const addEducation = () => {
  setEd(prev => [...prev, { ...emptyEd }]);
  setSelectedEdIndex(education.length); // Select the new entry
};
const selectEducation = idx => setSelectedEdIndex(idx);
const removeEducation = idx => {
  setEd(prev => prev.filter((_, i) => i !== idx));
  setSelectedEdIndex(selectedEdIndex === idx ? null : selectedEdIndex > idx ? selectedEdIndex - 1 : selectedEdIndex);
};

const addCertification = () => {
  setCerts(prev => [...prev, { ...emptyCert }]);
  setSelectedCertIndex(certifications.length);
};
const selectCertification = idx => setSelectedCertIndex(idx);
const removeCertification = idx => {
  setCerts(prev => prev.filter((_, i) => i !== idx));
  setSelectedCertIndex(selectedCertIndex === idx ? null : selectedCertIndex > idx ? selectedCertIndex - 1 : selectedCertIndex);
};
const addWork = () => {
  setWork(prev => [...prev, { ...emptyWork }]);
  setSelectedWorkIndex(workex.length); // select new entry
};
const selectWork = idx => setSelectedWorkIndex(idx);
const removeWork = idx => {
  setWork(prev => prev.filter((_, i) => i !== idx));
  setSelectedWorkIndex(
    selectedWorkIndex === idx
      ? null
      : selectedWorkIndex > idx
      ? selectedWorkIndex - 1
      : selectedWorkIndex
  );
};



  const handleSubmit = e => {
    e.preventDefault();
    if (
      !jobrole ||
      tech.length === 0 ||
      progLangs.length === 0 ||
      !dob ||
      education.length===0
    ) {
      alert("Please fill all compulsory fields.");
      return;
    }
    setPop(true);
  };

  const handleConfirm = async() => {
    setFailed(false);
  setPop(false);
 const payload=
    {
        jobrole,
        tech,
        progLangs, 
        education,
        workex,
        certifications,
        other_remarks,
        dob
    }
    console.log(payload)//USE PAYLOAD TO UPLOAD TO API AND ALSO DO GET API IN USEEFFECT
    const res=await axios.post("http://localhost:5000/update-details",{payload},{validateStatus: () => true,
                withCredentials: true});
    if(res.status===200)
    {
        setShow(true);//add redirect here after 1s delay
    }
    else
    {
        setFailed(true);
    }

};

  // Main UI
  return (
    <div>
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: "600px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#fafafa"
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        User Profile Form
      </h2>

      {/* Job Role Dropdown */}
      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>
        Job Role<span style={{ color: "red" }}>*</span>
      </label>
      <select
        value={jobrole}
        onChange={e => setJobrole(e.target.value)}
        required
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "16px",
          borderRadius: "4px",
          border: "1px solid #aaa"
        }}
      >
        <option value="" disabled>
          Select desired job role
        </option>
        {jobroles.map(role => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>

      
      {/* // --- Tech stacks dropdown + bubbles --- */}
    <>
      <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
        Tech Stacks<span style={{ color: "red" }}>*</span>
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <select
          value=""
          onChange={e => {
            const value = e.target.value;
            if (value && !tech.includes(value)) setTech([...tech, value]);
          }}
          style={{
            padding: 8, borderRadius: 4, border: "1px solid #aaa", width: "100%"
          }}
        >
          <option value="" disabled>
            Select tech stack
          </option>
          {stackOptions.filter(opt => !tech.includes(opt)).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 16px 0" }}>
        {tech.map((item, i) => (
          <div
            key={item}
            style={{
              background: "#e0f0ff",
              borderRadius: "16px",
              padding: "6px 16px 6px 10px",
              display: "flex",
              alignItems: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              position: "relative",
              fontSize: "14px"
            }}
          >
            {item}
            <span
              onClick={() => setTech(tech.filter((_, idx) => idx !== i))}
              style={{
                marginLeft: 8,
                cursor: "pointer",
                fontWeight: "700",
                color: "#333",
                fontSize: "16px",
                position: "absolute",
                top: "-7px",
                right: "-3px",
                background: "#f0f0f0",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 2px #aaa"
              }}
              title="Remove"
            >
              ×
            </span>
          </div>
        ))}
      </div>
    </>

    {/* // --- Programming Languages dropdown + bubbles --- */}
    <>
      <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
        Programming Languages<span style={{ color: "red" }}>*</span>
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <select
          value=""
          onChange={e => {
            const value = e.target.value;
            if (value && !progLangs.includes(value)) setProgLangs([...progLangs, value]);
          }}
          style={{
            padding: 8, borderRadius: 4, border: "1px solid #aaa", width: "100%"
          }}
        >
          <option value="" disabled>
            Select programming language
          </option>
          {languageOptions.filter(opt => !progLangs.includes(opt)).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 16px 0" }}>
        {progLangs.map((item, i) => (
          <div
            key={item}
            style={{
              background: "#fff4e6",
              borderRadius: "16px",
              padding: "6px 16px 6px 10px",
              display: "flex",
              alignItems: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              position: "relative",
              fontSize: "14px"
            }}
          >
            {item}
            <span
              onClick={() => setProgLangs(progLangs.filter((_, idx) => idx !== i))}
              style={{
                marginLeft: 8,
                cursor: "pointer",
                fontWeight: "700",
                color: "#333",
                fontSize: "16px",
                position: "absolute",
                top: "-7px",
                right: "-3px",
                background: "#f0f0f0",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 2px #aaa"
              }}
              title="Remove"
            >
              ×
            </span>
          </div>
        ))}
      </div>
    </>

      {/* Date of Birth */}
      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>
        Date of Birth<span style={{ color: "red" }}>*</span>
      </label>
      <input
        type="date"
        value={dob}
        onChange={e => setDob(e.target.value)}
        required
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "16px",
          borderRadius: "4px",
          border: "1px solid #aaa"
        }}
      />

     
        
    {/* Education Bubbles */}
        <legend style={{fontWeight:700}}>Education Details<span style={{ color: "red" }}>*</span></legend>
        

<div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
  <div
    onClick={addEducation}
    style={{
      border: "2px dashed #42a5f5",
      color: "#42a5f5",
      borderRadius: "16px",
      cursor: "pointer",
      padding: "8px",
      display: "flex",
      fontWeight: "bold",
      alignItems: "center"
    }}>
    + Add Degree
  </div>
  {education.map((ed, idx) => (
    <div
      key={idx}
      onClick={() => selectEducation(idx)}
      style={{
        background: selectedEdIndex === idx ? "#1976d2" : "#e3f2fd",
        color: selectedEdIndex === idx ? "white" : "#1976d2",
        borderRadius: "16px",
        padding: "8px 20px 8px 12px",
        display: "flex",
        alignItems: "center",
        fontWeight: 500,
        cursor: "pointer",
        boxShadow: "0 0 2px #bbb",
        position: "relative"
      }}
    >
      {ed.degree || `Degree #${idx + 1}`}
      <span
        title="Remove"
        onClick={e => {
          e.stopPropagation();
          removeEducation(idx);
        }}
        style={{
          marginLeft: 8,
          cursor: "pointer",
          color: "#d32f2f",
          fontWeight: "bold",
          fontSize: "18px",
          position: "absolute",
          top: "-7px",
          right: "-7px",
        }}
      >
        ×
      </span>
    </div>
  ))}
</div>
{selectedEdIndex !== null && education[selectedEdIndex] && (
  <fieldset style={{border: '1px solid #bbb', borderRadius:'6px', padding:'14px', marginTop:'12px'}}>
    {/* <legend style={{fontWeight:700}}>Education Details</legend> */}
    {["institute", "location", "grad_year", "degree", "cgpa", "honours"].map(field => (
      <label key={field} style={{ display:'block', marginTop:8, textTransform:'capitalize' }}>
        {field.replace("_", " ")}:
        <input
          type={field === "cgpa" ? "number" : field === "grad_year" ? "number" : "text"}
          value={education[selectedEdIndex][field] || ""}
          min={field === "cgpa" ? 0 : field === "grad_year" ? 1950 : undefined}
          max={field === "cgpa" ? 10 : field === "grad_year" ? new Date().getFullYear() : undefined}
          step={field === "cgpa" ? 0.01 : undefined}
          onChange={e =>
  setEd(prev =>
    prev.map((entry, i) =>
      i === selectedEdIndex
        ? {
            ...entry,
            [field]: (field === "cgpa" || field === "grad_year")
              ? (e.target.value === "" ? "" : Number(e.target.value))
              : e.target.value
          }
        : entry
    )
  )
}

          required={["institute", "location", "grad_year", "degree", "cgpa"].includes(field)}
          style={{
            width: "100%",
            padding: "6px",
            marginTop:"4px",
            borderRadius: "4px",
            border: "1px solid #aaa"
          }}
        />
      </label>
    ))}
  </fieldset>
)}



      {/* Optional: Certifications */}
  
        <legend style={{fontWeight:700}}>Certification details</legend>

<div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
  <div
    onClick={addCertification}
    style={{
      border: "2px dashed #42a5f5",
      color: "#42a5f5",
      borderRadius: "16px",
      cursor: "pointer",
      padding: "8px",
      display: "flex",
      fontWeight: "bold",
      alignItems: "center"
    }}>
    + Add Certification
  </div>
  {certifications.map((c, idx) => (
    <div
      key={idx}
      onClick={() => selectCertification(idx)}
      style={{
        background: selectedCertIndex === idx ? "#1976d2" : "#e3f2fd",
        color: selectedCertIndex === idx ? "white" : "#1976d2",
        borderRadius: "16px",
        padding: "8px 20px 8px 12px",
        display: "flex",
        alignItems: "center",
        fontWeight: 500,
        cursor: "pointer",
        boxShadow: "0 0 2px #bbb",
        position: "relative"
      }}
    >
      {c.name || `Certification #${idx + 1}`}
      <span
        title="Remove"
        onClick={e => {
          e.stopPropagation();
          removeCertification(idx);
        }}
        style={{
          marginLeft: 8,
          cursor: "pointer",
          color: "#d32f2f",
          fontWeight: "bold",
          fontSize: "18px",
          position: "absolute",
          top: "-7px",
          right: "-7px",
        }}
      >×</span>
    </div>
  ))}
</div>


{selectedCertIndex !== null && certifications[selectedCertIndex] && (
  <fieldset style={{border: '1px solid #bbb', borderRadius:'6px', padding:'14px', marginTop:'12px'}}>
    {/* <legend style={{fontWeight:700}}>Certification Details</legend> */}
    {["name", "date", "provider"].map(field => (
      <label key={field} style={{ display:'block', marginTop:8, textTransform:'capitalize' }}>
        {field.replace("_", " ")}:
        <input
          type={field === "date" ? "date" : "text"}
          value={certifications[selectedCertIndex][field] || ""}
          onChange={e =>
            setCerts(prev =>
              prev.map((entry, i) =>
                i === selectedCertIndex ? { ...entry, [field]: e.target.value } : entry
              )
            )
          }
          required={["name", "date", "provider"].includes(field)}
          style={{
            width: "100%",
            padding: "6px",
            marginTop:"4px",
            borderRadius: "4px",
            border: "1px solid #aaa"
          }}
        />
      </label>
    ))}
  </fieldset>
)}





      {/* Optional: Work Experience */}
      


        <legend style={{fontWeight:700}}>Work Experience Details</legend>

      <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
  <div
    onClick={addWork}
    style={{
      border: "2px dashed #42a5f5",
      color: "#42a5f5",
      borderRadius: "16px",
      cursor: "pointer",
      padding: "8px",
      display: "flex",
      fontWeight: "bold",
      alignItems: "center"
    }}>
    + Add Work
  </div>
  {workex.map((wx, idx) => (
    <div
      key={idx}
      onClick={() => selectWork(idx)}
      style={{
        background: selectedWorkIndex === idx ? "#1976d2" : "#e3f2fd",
        color: selectedWorkIndex === idx ? "white" : "#1976d2",
        borderRadius: "16px",
        padding: "8px 20px 8px 12px",
        display: "flex",
        alignItems: "center",
        fontWeight: 500,
        cursor: "pointer",
        boxShadow: "0 0 2px #bbb",
        position: "relative"
      }}
    >
      {wx.company || `Work #${idx + 1}`}
      <span
        title="Remove"
        onClick={e => {
          e.stopPropagation();
          removeWork(idx);
        }}
        style={{
          marginLeft: 8,
          cursor: "pointer",
          color: "#d32f2f",
          fontWeight: "bold",
          fontSize: "18px",
          position: "absolute",
          top: "-7px",
          right: "-7px"
        }}
      >×</span>
    </div>
  ))}
</div>
{selectedWorkIndex !== null && workex[selectedWorkIndex] && (
  <fieldset style={{ border: '1px solid #bbb', borderRadius:'6px', padding:'14px', marginTop:'12px' }}>
    <legend style={{ fontWeight: 700 }}>Work Experience Details</legend>
    {["company", "start_date", "end_date", "role", "remarks"].map(field => (
      <label key={field} style={{ display: 'block', marginTop: 8, textTransform: 'capitalize' }}>
        {field.replace("_", " ")}:
        <input
          type={["start_date", "end_date"].includes(field) ? "date" : "text"}
          value={workex[selectedWorkIndex][field] || ""}
          onChange={e =>
            setWork(prev =>
              prev.map((entry, i) =>
                i === selectedWorkIndex ? { ...entry, [field]: e.target.value } : entry
              )
            )
          }
          required={["company", "start_date", "role"].includes(field)}
          style={{
            width: "100%",
            padding: "6px",
            marginTop: "4px",
            borderRadius: "4px",
            border: "1px solid #aaa"
          }}
        />
      </label>
    ))}
  </fieldset>
)}


      {/* Optional: Other Remarks */}
      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>
        Other Remarks (Optional):
      </label>
      <textarea
        value={other_remarks}
        onChange={e => setRemarks(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          marginBottom: "22px",
          fontSize: "14px"
        }}
        rows="4"
      />

      <button
        type="submit"
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "6px",
          border: "none",
          backgroundColor: "#007bff",
          color: "white",
          fontWeight: "700",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >
        Submit
      </button>
      {show &&(
          <span style={{ color: "green" }}><br/><br/>details updated successfully</span>
      )}
      {failed &&(
          <span style={{ color: "red" }}><br/><br/>details could not be updated<br/>please try again...</span>
      )}
    </form>
    {pop && (
  <div style={{
    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
    background: "rgba(0,0,0,0.34)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
  }}>
    <div style={{
      background: "white", borderRadius: "8px", padding: "30px 26px", boxShadow: "0 2px 18px #6667", width: "320px",
      textAlign: "center", fontSize: "17px"
    }}>
      <strong>Are you sure you want to submit?</strong>
      <div style={{ marginTop: 28, display: "flex", gap: 14, justifyContent: "center" }}>
        <button
          onClick={handleConfirm}
          style={{ padding: "8px 22px", background: "#19d260ff", color: "#fff", border: "none", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>
          Confirm
        </button>
        <button
          onClick={
            ()=>{
                setShow(false);
                setFailed(false);
                setPop(false);
            }
          }
          style={{ padding: "8px 22px", background: "#ee0d0dff", color: "#fff", border: "none", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

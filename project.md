backend / app/ service 
                " prescription_service is not working it is working but data extraceted is empty list "
frontend : is not connected with backend "


aim of project is unclear : i am thingking by using the data of reports_json :- 
{
  "metrics": [
    {
      "unit": "mg/dL",
      "value": "168",
      "status": "HIGH",
      "biomarker_name": "Fasting Blood Glucose",
      "extracted_abbreviation": "FBG"
    },
    {
      "unit": "mg/dL",
      "value": "242",
      "status": "HIGH",
      "biomarker_name": "Post Prandial Blood Glucose",
      "extracted_abbreviation": "PPBG"
    },
    {
      "unit": "mg/dL",
      "value": "215",
      "status": "UNSPECIFIED",
      "biomarker_name": "Random Blood Sugar",
      "extracted_abbreviation": "RBS"
    },
    {
      "unit": "%",
      "value": "8.2",
      "status": "UNSPECIFIED",
      "biomarker_name": "HbA1c",
      "extracted_abbreviation": null
    },
    {
      "unit": "mg/dL",
      "value": "189",
      "status": "UNSPECIFIED",
      "biomarker_name": "Estimated Average Glucose",
      "extracted_abbreviation": "eAG"
    }
  ],
  "patient_demographics_found": false
}

also there is one problem that bio-markers has a difffrent table in idk why but it is there we need to remove that and modify this reports .json so that the biomarkers are extracted here only " 


1 more thing by narrowing the aim we can make a 1 good thing 
also let  me explain what is ocr : ocr is when any photo which is not scanned we use ocr as backup so that extraction dont fail 



at last in my opinion we should leave the prescription extraction and only focus on monitoring reporrts the medicine reminder is bullshit 
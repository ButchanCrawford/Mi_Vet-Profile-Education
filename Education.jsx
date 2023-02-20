import React from "react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import debug from "sabio-debug";
import vetProfilesService from "../../../services/vetProfilesService";
import SingleSchool from "./SingleSchool";
import SingleSchoolDelete from "./SingleSchoolDelete";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import toastr from "toastr";
import Swal from "sweetalert2";

function Education() {
  //This component allows veterinians to make education changes to their profile
  //Component connects to a .Net/SQL backend

  const _logger = debug.extend("Form");

  const { state } = useLocation();

  /*States to manage various education details (current eduction,
  school search results and form details ) */

  const [schools, setSchools] = useState({
    schoolsArray: [],
    schoolsSearchArray: [],
    schoolsComponents: [],
    pageIndex: 0,
    pageSize: 20,
  });

  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");

  const [currentVetEducation, setCurrentVetEduaction] = useState({
    current: [],
    component: [],
    degree: "",
    currentSchoolId: "",
  });

  const [formEducation, setFormEducation] = useState({
    vetSchoolId: "",
    degree: "",
  });

  //Get schools currently available
  useEffect(() => {
    vetProfilesService
      .getAllSchools()
      .then(onGetSchoolsSuccess)
      .catch(onGetSchoolsError);
  }, []);

  const onGetSchoolsSuccess = (resp) => {
    setSchools((prevState) => {
      const ps = { ...prevState };
      ps.schoolsArray = resp.items;
      return ps;
    });
  };

  // Searching for a school
  const onGetSchoolsError = (err) => {
    _logger("Could not get all schools", err);
    toastr.error("Could not get all schools");
  };

  const onSearhFormChanged = (e) => {
    const value = e.target.value;
    setSchoolSearchQuery((prevState) => {
      let newQuery = { ...prevState };
      newQuery = value;
      return newQuery;
    });
  };

  const onSearchClicked = (e) => {
    e.preventDefault();
    vetProfilesService
      .searchSchools(schools.pageIndex, schools.pageSize, schoolSearchQuery)
      .then(onGetSearchSuccess)
      .catch(onGetSearchError);
  };

  const onGetSearchSuccess = (resp) => {
    setSchools((prevState) => {
      const ps = { ...prevState };
      ps.schoolsSearchArray = resp.item.pagedItems.filter(filterForCurrent);
      ps.schoolsComponents = ps.schoolsSearchArray.map(mapSchool);
      return ps;
    });
  };

  const filterForCurrent = (item) => {
    return item.id !== currentVetEducation.currentSchoolId;
  };

  const onGetSearchError = (err) => {
    _logger("getSearchError", err);
    toastr.error("No results found");
  };

  const onEnterToSearch = (e) => {
    if (e.key === "Enter") {
      onSearchClicked(e);
    }
  };

  //Mapping search results onto the page
  const mapSchool = (aSchool) => {
    return (
      <SingleSchool
        aSchoolP={aSchool}
        onSchoolSelectedP={onSchoolSelected}
        key={aSchool.id}
        currentSchoolId={currentVetEducation.currentSchoolId}
      />
    );
  };

  const mapSchoolCurrent = (aSchool) => {
    return (
      <SingleSchoolDelete
        aSchoolP={aSchool}
        onSchoolDeletedP={onSchoolDeleted}
        key={aSchool.id}
        currentSchoolId={currentVetEducation.currentSchoolId}
      />
    );
  };

  // Selecting and deleting schools
  const onSchoolSelected = (e) => {
    toastr.success("School Selected");
    setFormEducation((prevState) => {
      const ps = { ...prevState };
      ps.vetSchoolId = e.target.value;
      return ps;
    });

    const filterSelected = (school) => {
      return Number(school.id) === Number(e.target.value);
    };

    setSchools((prevState) => {
      const ps = { ...prevState };
      ps.schoolsSearchArray = ps.schoolsArray.filter(filterSelected);
      ps.schoolsComponents = ps.schoolsSearchArray.map(mapSchool);
      return ps;
    });
  };

  const onSchoolDeleted = () => {
    Swal.fire({
      title: "Delete School?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteSchool(state.payload.id);
      } else if (result.isDenied) {
        toastr.error("Not deleted");
      }
    });
  };

  const deleteSchool = (id) => {
    vetProfilesService
      .deleteVetEducation(id)
      .then(onSchoolDeletedSucess)
      .catch(onSchoolDeletedError);
  };

  const onSchoolDeletedSucess = () => {
    setCurrentVetEduaction([]);
    _logger("School deleted successfully");
    toastr.success("School deleted successfully");
  };

  const onSchoolDeletedError = (err) => {
    _logger("Unable to delete school", err);
    toastr.error("Unable to delete school");
  };

  //Mapping current education details to page
  useEffect(() => {
    getMostRecentEducationData();
  }, [schools]);

  const onVetEducationSuccess = (resp) => {
    const r = resp;
    setCurrentVetEduaction((prevState) => {
      const ps = { ...prevState };
      ps.degree = r.item.degree;
      ps.current = r.item.school;
      ps.currentSchoolId = r.item.school[0].id;
      ps.component = ps.current.map(mapSchoolCurrent);
      return ps;
    });
  };

  const onCurrentSchoolError = (err) => {
    _logger("could not retrieve current school", err);
    toastr.errror("could not retrieve current school"); //All education Data deleted for demo
  };

  //Handling and updating eductaion data including forms

  const onFormChange = (e) => {
    setFormEducation((prevState) => {
      const ps = { ...prevState };
      ps.degree = e.target.value;
      return ps;
    });
  };

  const onFormSubmit = (e) => {
    const payloadAdd = {
      VetProfileId: state.payload.id,
      VetSchoolId: Number(formEducation.vetSchoolId),
      Degree: formEducation.degree,
    };

    const payloadUpd = {
      VetProfileId: state.payload.id,
      VetSchoolId: Number(formEducation.vetSchoolId),
      Degree: formEducation.degree,
    };
    e.preventDefault();
    if (currentVetEducation.degree) {
      vetProfilesService
        .updateVetEducation(payloadUpd)
        .then(onSubmitSuccess)
        .catch(onSubmitError);
    } else {
      e.preventDefault();
      vetProfilesService
        .addVetEducation(payloadAdd)
        .then(onSubmitSuccess)
        .catch(onSubmitError);
    }
  };

  const getMostRecentEducationData = () => {
    vetProfilesService
      .getVetEducation(state.payload.id)
      .then(onVetEducationSuccess)
      .catch(onCurrentSchoolError);
  };

  const resetSchoolSearch = () => {
    setSchools((prevState) => {
      const ps = { ...prevState };
      ps.schoolsComponents = [];
      return ps;
    });
  };

  const onSubmitSuccess = (err) => {
    getMostRecentEducationData();
    resetSchoolSearch();
    _logger("submit success", err);
    toastr.success("Submit Success");
  };

  const onSubmitError = (err) => {
    _logger("submit failed", err);
    toastr.error("submit failed");
  };

  //Returning View
  return (
    <React.Fragment>
      <Container>
        <Col>
          <div className="container p-4 card">
            <h3 className="text-center">Edit Education</h3>

            <Row className="mt-5">
              <Form className="ms-5 col-7">
                <Form.Control
                  type="search"
                  placeholder="Search College"
                  onChange={onSearhFormChanged}
                  onKeyPress={onEnterToSearch}
                  className="position-search-input-vet-form"
                />
              </Form>
              <Button
                className="col-2 me-1 position-search-button-vet-form"
                variant="primary"
                onClick={onSearchClicked}
              >
                Search
              </Button>
            </Row>
            <Row className="mt-5">
              <div>
                <h4 className="text-center">My Current Education</h4>
                <br />
                {currentVetEducation.degree ? (
                  <React.Fragment>
                    <div className="text-center">
                      <p>{currentVetEducation.degree}</p>
                    </div>
                    <div className="text-center">
                      {currentVetEducation.component}
                    </div>
                  </React.Fragment>
                ) : (
                  <h5 className="text-center">No current eduaction</h5>
                )}
              </div>
            </Row>
            <Row className="text-center mt-5">{schools.schoolsComponents}</Row>
            <Row>
              <Form>
                <label htmlFor="degree" className="form-label">
                  Enter Degree
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="degree"
                  placeholder="Please Enter Degree"
                  onChange={onFormChange}
                />
                <button
                  type="submit"
                  className="btn-vetprofile btn-primary-vetprofile position-submit-button-vet-form-edu-bio"
                  onClick={onFormSubmit}
                >
                  Submit
                </button>
              </Form>
            </Row>
          </div>
        </Col>
      </Container>
    </React.Fragment>
  );
}

export default Education;

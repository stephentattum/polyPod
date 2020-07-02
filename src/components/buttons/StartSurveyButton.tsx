import { useContext } from "react";
import { QuestionnaireContext } from "../../context/questionnaire-context";
import { Link } from "react-router-dom";
import React from "react";
import Questionnaire from "../../questionnaire/PpQuestionnaire";

export default function StartSurveyButton(
    { questionnaire }: { questionnaire : Questionnaire }
) {
    const {setQuestionnaireAndSwitchToFirstUnansweredQuestion} = useContext(
        QuestionnaireContext
    );
    return (
        <Link onClick={() => setQuestionnaireAndSwitchToFirstUnansweredQuestion(questionnaire)} to="/survey">
            Start Survey
        </Link>
    )
}
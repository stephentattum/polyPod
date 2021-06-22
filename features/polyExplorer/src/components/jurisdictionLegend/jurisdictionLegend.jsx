import React from "react";

import "./jurisdictionLegend.css";
import i18n from "../../i18n.js";
import LinkButton from "../linkButton/linkButton.jsx";

const JurisdictionLegend = ({ jurisdictionsState }) => {
    return (
        <div className="location-legend">
            <div className="source">
                <p>{i18n.t("common:source")}:</p>
                <p>polyPedia</p>
            </div>
            <div className="legend">
                <p className="jurisdictions-label">
                    {i18n.t("companyDetailsScreen:jurisdictions")}:
                </p>
                <div>
                    <div className="circle China"></div>
                    <p>{i18n.t("common:jurisdiction.china")}</p>
                </div>
                <div>
                    <div className="circle Five-Eyes"></div>
                    <p>{i18n.t("common:jurisdiction.fiveEyes")}</p>
                </div>
                <div>
                    <div className="circle Russia"></div>
                    <p>{i18n.t("common:jurisdiction.russia")}</p>
                </div>
                <div>
                    <div className="circle EU-GDPR"></div>
                    <p>{i18n.t("common:jurisdiction.euGdpr")}</p>
                </div>
                <div>
                    <div className="circle Others"></div>
                    <p>{i18n.t("common:jurisdiction.undisclosed")}</p>
                </div>
            </div>
            <LinkButton
                route="/data-region-info"
                className="info-button"
                stateChange={jurisdictionsState}
            >
                <img src="./images/question-circle.svg" />
            </LinkButton>
        </div>
    );
};

export default JurisdictionLegend;

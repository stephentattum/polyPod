import React from "react";
import CompanyShortInfo from "../companyShortInfo/companyShortInfo.jsx";
import "./companyList.css";

function groupCompanies(companies) {
    const sorted = companies.sort((a, b) => a.name.localeCompare(b.name));
    const groups = {};
    sorted.forEach((company) => {
        const key = company.name[0].toUpperCase();
        groups[key] = groups[key] || [];
        groups[key].push(company);
    });
    return groups;
}

const CompanyList = ({ companies, onShowScreenChange }) => {
    const companyGroups = groupCompanies(companies);
    return (
        <div className="company-list">
            <button
                className="filter-button"
                onClick={() => onShowScreenChange("companyFilter")}
            ></button>
            {Object.entries(companyGroups).map(([label, companies], index) => (
                <div key={index} className="company-group">
                    <div className="company-group-label">{label}</div>
                    <div className="company-group-companies">
                        {companies.map((company, index) => (
                            <CompanyShortInfo
                                key={index}
                                company={company}
                                onShowScreenChange={onShowScreenChange}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CompanyList;

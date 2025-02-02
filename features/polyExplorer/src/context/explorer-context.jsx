import React, { useEffect, useState } from "react";
import { pod } from "../fakePod.js";
import { useHistory, useLocation } from "react-router-dom";
import i18n from "../i18n.js";

//model
import { Company } from "../model/company.js";
import { Product } from "../model/product.js";
import { EntityFilter } from "../model/entityFilter.js";

//local-data imports
import polyPediaCompanies from "../data/companies.json";
import globalData from "../data/global.json";
import polyPediaProducts from "../data/products.json";

export const ExplorerContext = React.createContext();

//storage
const namespace = "http://polypoly.coop/schema/polyExplorer/#";

async function readFirstRun() {
    const quads = await pod.polyIn.select({});
    return !quads.some(
        ({ subject, predicate, object }) =>
            subject.value === `${namespace}polyExplorer` &&
            predicate.value === `${namespace}firstRun` &&
            object.value === `${namespace}false`
    );
}

async function writeFirstRun(firstRun) {
    const { dataFactory, polyIn } = pod;
    const quad = dataFactory.quad(
        dataFactory.namedNode(`${namespace}polyExplorer`),
        dataFactory.namedNode(`${namespace}firstRun`),
        dataFactory.namedNode(`${namespace}${firstRun}`)
    );
    polyIn.add(quad);
}

function loadCompanies() {
    return Object.fromEntries(
        Object.values(polyPediaCompanies).map((company) => [
            company.ppid,
            new Company(company, globalData, i18n),
        ])
    );
}

function loadProducts() {
    return Object.fromEntries(
        Object.values(polyPediaProducts).map((product) => [
            product.ppid,
            new Product(product, globalData, i18n),
        ])
    );
}

//Stubbed function for now
//This needs to load the actual stories present
//Also I don't like the navigation too much -> should include the path and content
//Will be clearer when we know the content structure
const loadStoriesMetadata = () => {
    return {
        messenger: {
            title: "story.messenger.title",
            previewText: "story.messenger.summarize",
            img: {
                src: "images/stories/messenger/card-image.svg",
                alt: "story.messenger.alt",
            },
            route: "/story/messenger-story",
        },
        digitalGiants: {
            title: "story.digitalGiants.title",
            previewText: "story.digitalGiants.summarize",
            img: {
                src: "images/stories/digital-giants/card-image.svg",
                alt: "story.digitalGiants.alt",
            },
            route: "/story/digital-giants-story",
        },
    };
};

export const ExplorerProvider = ({ children }) => {
    //router hooks
    const history = useHistory();
    const location = useLocation();

    //state
    const navigationStates = [
        "firstRun",
        "showClusters",
        "selectedEntity",
        "explorationState",
    ];
    const [navigationState, setNavigationState] = useState({
        firstRun: false,
        showClusters: true,
        selectedEntity: null,
        explorationState: {
            section: null,
            index: null,
            category: null,
        },
    });
    const [activeFilters, setActiveFilters] = useState(new EntityFilter());

    //constants
    const companies = loadCompanies();
    const products = loadProducts();
    const entities = { ...companies, ...products };
    const entitiesList = Object.values(entities).sort((a, b) =>
        a.compareNames(b)
    );
    const featuredEntities = entitiesList.filter((company) => company.featured);
    const selectedEntity = navigationState.selectedEntity;
    const selectedEntityObject = entities[selectedEntity];
    const dataRecipients = entities[selectedEntity]?.dataRecipients?.map(
        (ppid) => entities[ppid]
    );
    const currentPath = location.pathname;
    const storiesMetadata = loadStoriesMetadata();

    //change the navigationState like so: changeNavigationState({<changedState>:<changedState>})
    function changeNavigationState(changedState) {
        if (changedState) {
            Object.keys(changedState).forEach((key) => {
                if (!navigationStates.includes(key)) {
                    console.log(`NavigationStateError with key: ${key}`);
                    return;
                }
            });
            setNavigationState({ ...navigationState, ...changedState });
        }
    }

    function routeTo(path, changedState) {
        Object.keys(changedState).forEach((key) => {
            if (!navigationStates.includes(key)) {
                console.log(`NavigationStateError with key: ${key}`);
                return;
            }
        });
        const newNavState = { ...navigationState, ...changedState };
        history.push(path, newNavState);
        setNavigationState(newNavState);
    }

    function handleBack() {
        if (currentPath != "/") {
            history.goBack();
            if (history.location.state) {
                changeNavigationState(history.location.state);
            }
        }
    }

    function entityObjectByPpid(ppid) {
        return entities[ppid];
    }

    function entityJurisdictionByPpid(ppid) {
        return entityObjectByPpid(ppid)?.jurisdiction;
    }

    function handleOnboardingPopupClose() {
        changeNavigationState({ firstRun: false });
        writeFirstRun(false);
    }

    function handleOnboardingPopupMoreInfo() {
        handleOnboardingPopupClose();
        history.push("/info");
    }

    function updatePodNavigation() {
        if (currentPath == "/")
            pod.polyNav.setTitle(i18n.t(`common:screenTitle.main`));
        else if (
            currentPath == "/data-exploration" ||
            currentPath == "/entity-details"
        )
            pod.polyNav.setTitle(selectedEntityObject.name);
        else if (currentPath.startsWith("/story/"))
            pod.polyNav.setTitle("data-story name goes here");
        else
            pod.polyNav.setTitle(
                i18n.t(`common:screenTitle.${currentPath.slice(1)}`)
            );

        pod.polyNav.actions = navigationState.firstRun
            ? {
                  info: () => {},
                  search: () => {},
              }
            : {
                  info: () => history.push("/info"),
                  search: () => history.push("/search"),
                  back: handleBack,
              };
        pod.polyNav.setActiveActions(
            currentPath == "/main" ? ["info", "search"] : ["back"]
        );
    }

    const counts = {
        dataTypes: Object.values(featuredEntities).map(
            (entity) => entity.dataTypesShared.length
        ),
        purposes: Object.values(featuredEntities).map(
            (entity) => entity.dataSharingPurposes.length
        ),
        companies: Object.values(featuredEntities).map(
            (entity) => entity.dataRecipients.length
        ),
        jurisdictions: Object.values(featuredEntities).map(
            (entity) => entity.jurisdictionsShared.children.length
        ),
    };

    //Get the max values of all featured companies
    function calculateAverage(values) {
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        return Math.round(10 * average) / 10;
    }

    const featuredEntityMaxValues = Object.fromEntries(
        Object.entries(counts).map(([key, value]) => [key, Math.max(...value)])
    );

    const featuredEntityAverageValues = Object.fromEntries(
        Object.entries(counts).map(([key, value]) => [
            key,
            calculateAverage(value),
        ])
    );

    const handleRemoveFilter = (field, value) => {
        activeFilters.remove(field, value);
        setActiveFilters(activeFilters.copy());
    };

    const handleFilterApply = (newActiveFilters) => {
        setActiveFilters(newActiveFilters);
    };

    //on-startup
    useEffect(() => {
        setTimeout(
            () =>
                readFirstRun().then((firstRun) =>
                    changeNavigationState({
                        firstRun: firstRun,
                    })
                ),
            300
        );
    }, []);

    //on-change
    useEffect(() => {
        updatePodNavigation();
    });

    return (
        <ExplorerContext.Provider
            value={{
                navigationState,
                changeNavigationState,
                handleOnboardingPopupClose,
                handleOnboardingPopupMoreInfo,
                routeTo,
                handleBack,
                entities,
                companies,
                entitiesList,
                featuredEntities,
                selectedEntityObject,
                entityObjectByPpid,
                entityJurisdictionByPpid,
                dataRecipients,
                globalData,
                featuredEntityMaxValues,
                featuredEntityAverageValues,
                activeFilters,
                handleRemoveFilter,
                handleFilterApply,
                storiesMetadata,
                products,
            }}
        >
            {children}
        </ExplorerContext.Provider>
    );
};

package eu.polypoly.pod.android

import android.os.Bundle
import androidx.fragment.app.testing.launchFragmentInContainer
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.doesNotExist
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.espresso.web.assertion.WebViewAssertions.webMatches
import androidx.test.espresso.web.sugar.Web.onWebView
import androidx.test.espresso.web.webdriver.DriverAtoms.*
import androidx.test.espresso.web.webdriver.Locator
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.rule.ActivityTestRule
import org.hamcrest.CoreMatchers.containsString
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@LargeTest
class FeatureFragmentInstrumentedTest {

    @get:Rule
    val activityRule = ActivityTestRule(MainActivity::class.java)

    @Test
    fun firstFragmentIsShown() {
        onView(withText("helloWorld"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun canNavigateToFeatureFragment() {
        onView(withText("helloWorld"))
            .check(matches(isDisplayed()))  // verify I'm starting on first view

        onView(withText("helloWorld"))
            .perform(click())

        onView(withText("helloWorld"))
            .check(doesNotExist())

        onWebView()
            .inWindow(selectFrameByIdOrName("harness"))
            .withElement(findElement(Locator.CLASS_NAME, "helloWorldStyle"))
            .check(webMatches(getText(), containsString("Hello World!")))
    }

    @Test
    fun canFindTextInWebView() {
        val fragmentArgs = Bundle().apply {
            putString("featureName", "helloWorld")
        }

        launchFragmentInContainer<FeatureFragment>(fragmentArgs)

        onWebView()
            .inWindow(selectFrameByIdOrName("harness"))
            .withElement(findElement(Locator.CLASS_NAME, "helloWorldStyle"))
            .check(webMatches(getText(), containsString("Hello World!")))
    }
}

package coop.polypoly.polypod

import android.content.Context
import android.widget.Toast
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

class Authentication {
    companion object {
        private const val desiredLockScreenType =
            BiometricManager.Authenticators.BIOMETRIC_WEAK or
                BiometricManager.Authenticators.DEVICE_CREDENTIAL

        fun shouldShowBiometricsPrompt(context: Context): Boolean {
            return biometricsAvailable(context) &&
                Preferences.getBiometricCheck(context) &&
                !Preferences.getBiometricEnabled(context) &&
                !Preferences.isFirstRun(context)
        }

        fun setUp(
            activity: FragmentActivity,
            setupComplete: () -> Unit
        ) {
            authenticate(activity, true) { success ->
                if (success)
                    setupComplete()
            }
        }

        fun authenticate(
            activity: FragmentActivity,
            force: Boolean = false,
            authComplete: ((Boolean) -> Unit)
        ) {
            if (!biometricsAvailable(activity) ||
                (!force && !Preferences.getBiometricEnabled(activity))
            ) {
                authComplete(true)
                return
            }

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle(activity.getString(R.string.auth_prompt_title))
                .setSubtitle(activity.getString(R.string.auth_prompt_subtitle))
                .setAllowedAuthenticators(desiredLockScreenType)
                .build()

            val executor = ContextCompat.getMainExecutor(activity)
            val callback = PolyAuthCallback(activity, authComplete)

            BiometricPrompt(activity, executor, callback)
                .authenticate(promptInfo)
        }

        private fun biometricsAvailable(context: Context): Boolean {
            val biometricManager = BiometricManager.from(context)
            return biometricManager.canAuthenticate(desiredLockScreenType) ==
                BiometricManager.BIOMETRIC_SUCCESS
        }
    }

    private class PolyAuthCallback(
        val context: Context,
        val authComplete: (Boolean) -> Unit
    ) : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(
            result: BiometricPrompt.AuthenticationResult
        ) {
            super.onAuthenticationSucceeded(result)
            Toast.makeText(
                context,
                context.getString(R.string.auth_prompt_success),
                Toast.LENGTH_SHORT
            ).show()
            authComplete(true)
        }

        override fun onAuthenticationError(
            errorCode: Int,
            errString: CharSequence
        ) {
            super.onAuthenticationError(errorCode, errString)
            authComplete(false)
        }

        override fun onAuthenticationFailed() {
            super.onAuthenticationFailed()
            authComplete(false)
        }
    }
}

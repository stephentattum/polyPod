package eu.polypoly.pod.android

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import org.slf4j.LoggerFactory

/**
 * A simple [Fragment] subclass as the default destination in the navigation.
 */
class FeaturesListFragment : Fragment() {
    companion object {
        @Suppress("JAVA_CLASS_ON_COMPANION")
        private val logger = LoggerFactory.getLogger(javaClass.enclosingClass)
    }

    private lateinit var recyclerView: RecyclerView
    private lateinit var viewAdapter: RecyclerView.Adapter<*>
    private lateinit var viewManager: RecyclerView.LayoutManager

    override fun onCreateView(
            inflater: LayoutInflater, container: ViewGroup?,
            savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_features_list, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val context = requireContext()
        val features = findInstalledFeatures(context)

        viewManager = LinearLayoutManager(context)
        viewAdapter = InstalledFeatureTeaser(this, features)

        recyclerView = view.findViewById(R.id.features_list)
        recyclerView.apply {
            setHasFixedSize(true)
            layoutManager = viewManager
            adapter = viewAdapter
        }
    }

    private fun findInstalledFeatures(context: Context): Array<String> {
        var features = context.assets.list("features")
        if (features.isNullOrEmpty()) {
            features = arrayOf()
        }
        for (feature in features) {
            logger.debug("Found feature: '{}'", feature)
        }
        return features
    }
}

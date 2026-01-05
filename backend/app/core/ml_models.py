"""
Advanced ML Models for Pattern Recognition
Implements machine learning algorithms for enhanced pattern detection
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
from collections import defaultdict, deque
import json
import pickle
from pathlib import Path

# ML imports (optional, with fallbacks)
try:
    from sklearn.ensemble import RandomForestClassifier, IsolationForest
    from sklearn.cluster import DBSCAN
    from sklearn.preprocessing import StandardScaler
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics import silhouette_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class EventFeatureExtractor:
    """Extract features from events for ML models"""
    
    def __init__(self):
        self.app_encoder = defaultdict(lambda: len(self.app_encoder))
        self.type_encoder = defaultdict(lambda: len(self.type_encoder))
        
    def extract_features(self, events: List[Dict]) -> np.ndarray:
        """Extract numerical features from events"""
        if not events:
            return np.array([])
        
        features = []
        
        # Time-based features
        timestamps = [e.get('timestamp', datetime.utcnow()) for e in events]
        if timestamps:
            # Convert to numeric (seconds since first event)
            if isinstance(timestamps[0], str):
                timestamps = [datetime.fromisoformat(ts.replace('Z', '+00:00')) for ts in timestamps]
            time_diffs = [(ts - timestamps[0]).total_seconds() for ts in timestamps]
            
            features.extend([
                np.mean(time_diffs) if time_diffs else 0,
                np.std(time_diffs) if len(time_diffs) > 1 else 0,
                max(time_diffs) if time_diffs else 0,
                len(time_diffs)
            ])
        
        # Event type distribution
        type_counts = defaultdict(int)
        app_counts = defaultdict(int)
        
        for event in events:
            event_type = event.get('type', 'unknown')
            app = event.get('meta', {}).get('app', 'unknown')
            
            type_counts[event_type] += 1
            app_counts[app] += 1
        
        # Normalize counts
        total_events = len(events)
        type_features = [type_counts[t] / total_events for t in ['window_focus', 'app_switch', 'key_press', 'mouse_move']]
        app_features = [app_counts[a] / total_events for a in ['VSCode', 'Browser', 'Terminal', 'Email']]
        
        features.extend(type_features + app_features)
        
        # Pattern features
        features.extend([
            self._calculate_entropy(list(type_counts.values())),
            self._calculate_entropy(list(app_counts.values())),
            self._detect_repeating_patterns(events)
        ])
        
        return np.array(features)
    
    def _calculate_entropy(self, counts: List[int]) -> float:
        """Calculate Shannon entropy"""
        if not counts or sum(counts) == 0:
            return 0.0
        
        probabilities = [c / sum(counts) for c in counts if c > 0]
        return -sum(p * np.log2(p) for p in probabilities)
    
    def _detect_repeating_patterns(self, events: List[Dict]) -> float:
        """Detect repeating patterns in event sequence"""
        if len(events) < 4:
            return 0.0
        
        # Simple pattern detection: look for repeated sequences
        sequence = [e.get('type', 'unknown') for e in events]
        pattern_score = 0.0
        
        # Look for 2-3 length repeating patterns
        for length in [2, 3]:
            if len(sequence) < length * 2:
                continue
                
            patterns = defaultdict(int)
            for i in range(len(sequence) - length + 1):
                pattern = tuple(sequence[i:i+length])
                patterns[pattern] += 1
            
            # Score based on pattern repetition
            for count in patterns.values():
                if count > 1:
                    pattern_score += (count - 1) * length
        
        return pattern_score / len(events)


class ProductivityClassifier:
    """ML-based productivity pattern classifier"""
    
    def __init__(self):
        self.feature_extractor = EventFeatureExtractor()
        self.model = None
        self.scaler = StandardScaler() if SKLEARN_AVAILABLE else None
        self.is_trained = False
        
    def train(self, training_data: List[Tuple[List[Dict], str]]) -> bool:
        """Train the productivity classifier"""
        if not SKLEARN_AVAILABLE:
            return False
        
        X = []
        y = []
        
        for events, label in training_data:
            features = self.feature_extractor.extract_features(events)
            if len(features) > 0:
                X.append(features)
                y.append(label)
        
        if len(X) < 10:
            return False
        
        X = np.array(X)
        y = np.array(y)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Random Forest
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        return True
    
    def predict_productivity(self, events: List[Dict]) -> Dict:
        """Predict productivity patterns from events"""
        if not self.is_trained or not SKLEARN_AVAILABLE:
            return self._fallback_prediction(events)
        
        features = self.feature_extractor.extract_features(events)
        if len(features) == 0:
            return {"prediction": "unknown", "confidence": 0.0}
        
        features_scaled = self.scaler.transform([features])
        prediction = self.model.predict(features_scaled)[0]
        confidence = max(self.model.predict_proba(features_scaled)[0])
        
        return {
            "prediction": prediction,
            "confidence": float(confidence),
            "features": features.tolist()
        }
    
    def _fallback_prediction(self, events: List[Dict]) -> Dict:
        """Fallback prediction without ML"""
        if not events:
            return {"prediction": "unknown", "confidence": 0.0}
        
        # Simple rule-based prediction
        app_switches = sum(1 for e in events if e.get('type') == 'app_switch')
        focus_events = sum(1 for e in events if e.get('type') == 'window_focus')
        
        if app_switches > focus_events * 2:
            return {"prediction": "distracted", "confidence": 0.7}
        elif focus_events > app_switches * 3:
            return {"prediction": "focused", "confidence": 0.6}
        else:
            return {"prediction": "balanced", "confidence": 0.5}


class AnomalyDetector:
    """Detect anomalous behavior patterns"""
    
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42) if SKLEARN_AVAILABLE else None
        self.feature_extractor = EventFeatureExtractor()
        self.baseline_features = []
        
    def establish_baseline(self, normal_events: List[List[Dict]]) -> bool:
        """Establish baseline from normal event patterns"""
        if not SKLEARN_AVAILABLE:
            return False
        
        features = []
        for events in normal_events:
            feat = self.feature_extractor.extract_features(events)
            if len(feat) > 0:
                features.append(feat)
        
        if len(features) < 10:
            return False
        
        self.baseline_features = np.array(features)
        self.model.fit(self.baseline_features)
        return True
    
    def detect_anomalies(self, events: List[Dict]) -> Dict:
        """Detect if current events are anomalous"""
        if not SKLEARN_AVAILABLE or len(self.baseline_features) == 0:
            return self._fallback_anomaly_detection(events)
        
        features = self.feature_extractor.extract_features(events)
        if len(features) == 0:
            return {"is_anomaly": False, "score": 0.0, "reason": "insufficient_data"}
        
        anomaly_score = self.model.decision_function([features])[0]
        is_anomaly = anomaly_score < 0
        
        return {
            "is_anomaly": is_anomaly,
            "score": float(-anomaly_score),
            "reason": "statistical_outlier" if is_anomaly else "normal_pattern"
        }
    
    def _fallback_anomaly_detection(self, events: List[Dict]) -> Dict:
        """Simple anomaly detection without ML"""
        if len(events) < 5:
            return {"is_anomaly": False, "score": 0.0, "reason": "insufficient_data"}
        
        # Check for unusual patterns
        event_types = [e.get('type') for e in events]
        type_counts = defaultdict(int)
        for et in event_types:
            type_counts[et] += 1
        
        # Anomaly if one type dominates > 80%
        max_count = max(type_counts.values())
        if max_count / len(events) > 0.8:
            return {
                "is_anomaly": True,
                "score": 0.7,
                "reason": "dominant_event_type"
            }
        
        return {"is_anomaly": False, "score": 0.0, "reason": "normal_distribution"}


class PatternClusterer:
    """Cluster similar event patterns"""
    
    def __init__(self):
        self.model = DBSCAN(eps=0.5, min_samples=3) if SKLEARN_AVAILABLE else None
        self.feature_extractor = EventFeatureExtractor()
        self.scaler = StandardScaler() if SKLEARN_AVAILABLE else None
        
    def cluster_patterns(self, event_sequences: List[List[Dict]]) -> Dict:
        """Cluster event sequences by similarity"""
        if not SKLEARN_AVAILABLE:
            return self._fallback_clustering(event_sequences)
        
        # Extract features for each sequence
        features = []
        valid_indices = []
        
        for i, events in enumerate(event_sequences):
            feat = self.feature_extractor.extract_features(events)
            if len(feat) > 0:
                features.append(feat)
                valid_indices.append(i)
        
        if len(features) < 3:
            return {"clusters": [], "n_clusters": 0, "silhouette_score": 0.0}
        
        features = np.array(features)
        features_scaled = self.scaler.fit_transform(features)
        
        # Perform clustering
        cluster_labels = self.model.fit_predict(features_scaled)
        n_clusters = len(set(cluster_labels)) - (1 if -1 in cluster_labels else 0)
        
        # Calculate silhouette score
        silhouette = 0.0
        if n_clusters > 1:
            try:
                silhouette = silhouette_score(features_scaled, cluster_labels)
            except:
                pass
        
        # Organize results
        clusters = defaultdict(list)
        for idx, label in zip(valid_indices, cluster_labels):
            clusters[label].append(idx)
        
        return {
            "clusters": dict(clusters),
            "n_clusters": n_clusters,
            "silhouette_score": float(silhouette)
        }
    
    def _fallback_clustering(self, event_sequences: List[List[Dict]]) -> Dict:
        """Simple clustering based on event counts"""
        clusters = {}
        for i, events in enumerate(event_sequences):
            # Simple clustering by event count
            cluster_id = len(events) // 10  # Group by 10s
            if cluster_id not in clusters:
                clusters[cluster_id] = []
            clusters[cluster_id].append(i)
        
        return {
            "clusters": clusters,
            "n_clusters": len(clusters),
            "silhouette_score": 0.0
        }


class MLPatternEngine:
    """Main ML pattern engine"""
    
    def __init__(self):
        self.classifier = ProductivityClassifier()
        self.anomaly_detector = AnomalyDetector()
        self.clusterer = PatternClusterer()
        self.model_path = Path(__file__).parent.parent.parent / 'data' / 'ml_models.pkl'
        
    def initialize(self) -> bool:
        """Initialize ML models"""
        # Try to load pre-trained models
        if self.model_path.exists():
            try:
                with open(self.model_path, 'rb') as f:
                    models = pickle.load(f)
                self.classifier = models.get('classifier', self.classifier)
                self.anomaly_detector = models.get('anomaly_detector', self.anomaly_detector)
                return True
            except:
                pass
        
        # Initialize with basic training if possible
        return self._train_basic_models()
    
    def _train_basic_models(self) -> bool:
        """Train basic models with synthetic data"""
        # Generate synthetic training data
        synthetic_data = self._generate_synthetic_data()
        
        # Train classifier
        classifier_success = self.classifier.train(synthetic_data)
        
        # Establish anomaly baseline
        normal_patterns = [events for events, _ in synthetic_data if len(events) > 5]
        anomaly_success = self.anomaly_detector.establish_baseline(normal_patterns)
        
        return classifier_success or anomaly_success
    
    def _generate_synthetic_data(self) -> List[Tuple[List[Dict], str]]:
        """Generate synthetic training data"""
        import random
        
        synthetic_data = []
        event_types = ['window_focus', 'app_switch', 'key_press', 'mouse_move']
        apps = ['VSCode', 'Browser', 'Terminal', 'Email']
        
        for _ in range(50):
            # Generate random events
            n_events = random.randint(10, 50)
            events = []
            
            for i in range(n_events):
                event = {
                    'user_id': 'synthetic',
                    'event_id': f'syn_{i}',
                    'timestamp': datetime.utcnow() + timedelta(seconds=i*random.randint(1, 60)),
                    'type': random.choice(event_types),
                    'meta': {'app': random.choice(apps)}
                }
                events.append(event)
            
            # Assign label based on pattern
            app_switches = sum(1 for e in events if e['type'] == 'app_switch')
            
            if app_switches > n_events * 0.3:
                label = 'distracted'
            elif app_switches < n_events * 0.1:
                label = 'focused'
            else:
                label = 'balanced'
            
            synthetic_data.append((events, label))
        
        return synthetic_data
    
    def analyze_patterns(self, events: List[Dict]) -> Dict:
        """Comprehensive pattern analysis"""
        results = {
            'productivity': self.classifier.predict_productivity(events),
            'anomaly': self.anomaly_detector.detect_anomalies(events),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Add clustering if we have multiple sequences
        if len(events) > 20:
            # Split into smaller sequences for clustering
            sequences = [events[i:i+10] for i in range(0, len(events), 10)]
            if len(sequences) > 2:
                results['clustering'] = self.clusterer.cluster_patterns(sequences)
        
        return results
    
    def save_models(self) -> bool:
        """Save trained models"""
        try:
            models = {
                'classifier': self.classifier,
                'anomaly_detector': self.anomaly_detector,
                'clusterer': self.clusterer
            }
            
            self.model_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.model_path, 'wb') as f:
                pickle.dump(models, f)
            return True
        except:
            return False


# Global ML engine instance
ml_engine = MLPatternEngine()

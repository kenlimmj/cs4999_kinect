﻿using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace facerec
{
    /// <summary>
    /// Contains the results of a face recognition operation
    /// </summary>
    public class RecognitionResult : IDisposable
    {
        /// <summary>
        /// Gets or sets the original color frame
        /// </summary>
        public Bitmap OriginalBitmap { get; set; }

        /// <summary>
        /// Gets or sets the processed color frame (with a boundary drawn around the face)
        /// </summary>
        public Bitmap ProcessedBitmap { get; set; }

        /// <summary>
        /// Gets or sets a list of faces detected in the image
        /// </summary>
        public IEnumerable<Face> Faces { get; set; }

        /// <summary>
        /// Recursively disposes the object and nullifies pointers
        /// </summary>
        public void Dispose()
        {
            if (this.OriginalBitmap != null)
            {
                this.OriginalBitmap.Dispose();
                this.OriginalBitmap = null;
            }

            if (this.ProcessedBitmap != null)
            {
                this.ProcessedBitmap.Dispose();
                this.ProcessedBitmap = null;
            }

            if (this.Faces != null)
            {
                foreach (var face in this.Faces)
                {
                    face.GrayFace.Dispose();
                }

                this.Faces = null;
            }
        }

        /// <summary>
        /// A detected face - key will be null if no face is recognized
        /// </summary>
        public class Face
        {
            /// <summary>
            /// Gets or sets the results of face tracking
            /// </summary>
            public TrackingResults TrackingResults { get; set; }

            /// <summary>
            /// Gets or sets the grayscale, 100x100 image of the face to be used for matching
            /// </summary>
            public Bitmap GrayFace { get; set; }

            /// <summary>
            /// Gets or sets the key of the recognized image, if any
            /// </summary>
            public string Key { get; set; }

            /// <summary>
            /// Gets or sets the Euclidean eigen-distance from the current image to a recognized face
            /// </summary>
            public float EigenDistance { get; set; }
        }
    }
}

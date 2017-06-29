// @flow

import React from 'react'
import YouTube from 'react-youtube'
import { compose, graphql } from 'react-apollo'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

import currentLessonQuery from '../../shared/graphql/queries/currentLesson'

import lessonWatchedMutationParams from '../../shared/graphql/mutations/lessonWatchedMutationParams'
import lessonWatchedMutationSchema from '../../shared/graphql/queries/lessonWatchedMutationSchema'

class Lecture extends React.Component {
  render () {
    if (!this.props.data.Lesson) {
      return (
        <div>
          <h2>Congratulations!</h2>
            <p>
              You have watched all available lectures in this course.
            </p>
        </div>
      )
    }

    if (this.props.data.loading) {
      return (<p>Loading...</p>)
    }

    if (this.props.data.error) {
      return (<p>Error...</p>)
    }

    const selectedCourse = this.props.selectedCourse || this.props.match.params.courseId

    return (
      <div id='video'>
        <LectureVideoWithRouter lesson={this.props.data.Lesson} courseId={selectedCourse} />
      </div>
    )
  }
}

export class LectureVideo extends React.Component {
  render () {
    const opts = {
      height: '390',
      width: '640',
      playerVars: { // https://developers.google.com/youtube/player_parameters
        autoplay: 0
      }
    }

    return (
      <YouTube
        videoId={this.props.lesson.youtubeId}
        opts={opts}
        onEnd={this._onEnd}
      />
    )
  }

  _onEnd = () => {
    this.props.lessonWatchedMutation(this.props.courseId)
    this.props.dispatch(push('/wellDone'))
  }
}

const LectureVideoWithRouter = compose(
  graphql(lessonWatchedMutationSchema, lessonWatchedMutationParams),
  withRouter,
  connect()
)(LectureVideo)

const mapStateToProps = (state) => {
  return {
    selectedCourse: state.course.selectedCourse
  }
}

export default compose(
  connect(mapStateToProps),
  graphql(currentLessonQuery, {
    options: (ownProps) => {
      const selectedCourse = ownProps.selectedCourse || ownProps.match.params.courseId
      return ({
        variables: { courseId: selectedCourse },
        fetchPolicy: 'network-only'
      })
    }
  })
)(Lecture)
